from flask import Blueprint, request, jsonify
from flask_socketio import emit, join_room, leave_room
from utils.db import db
from bson import ObjectId
from datetime import datetime

messages_bp = Blueprint("messages", __name__)
messages_col = db["messages"]

# ── Helper: build a unique room id for two users (sorted so order doesn't matter)
def room_id(user_a, user_b):
    return "__".join(sorted([user_a, user_b]))


# ── GET all conversations for a user
# Returns one entry per unique conversation partner, with the latest message
@messages_bp.route("/messages/conversations", methods=["GET"])
def get_conversations():
    user = request.args.get("user")
    if not user:
        return jsonify({"message": "Missing user"}), 400

    # Find all messages where this user is sender or receiver
    pipeline = [
        {"$match": {"$or": [{"from": user}, {"to": user}]}},
        {"$sort": {"timestamp": -1}},
        {"$group": {
            "_id": {
                "$cond": [{"$eq": ["$from", user]}, "$to", "$from"]
            },
            "lastMessage": {"$first": "$text"},
            "lastTime": {"$first": "$timestamp"},
            "itemTitle": {"$first": "$itemTitle"},
            "unread": {
                "$sum": {
                    "$cond": [
                        {"$and": [{"$eq": ["$to", user]}, {"$eq": ["$read", False]}]},
                        1, 0
                    ]
                }
            }
        }},
        {"$sort": {"lastTime": -1}}
    ]

    convos = list(messages_col.aggregate(pipeline))
    for c in convos:
        c["partner"] = c.pop("_id")

    return jsonify(convos)


# ── GET messages between two users
@messages_bp.route("/messages", methods=["GET"])
def get_messages():
    user = request.args.get("user")
    partner = request.args.get("partner")
    if not user or not partner:
        return jsonify({"message": "Missing params"}), 400

    # Only the two participants can read their messages
    msgs = list(messages_col.find({
        "$or": [
            {"from": user, "to": partner},
            {"from": partner, "to": user}
        ]
    }).sort("timestamp", 1))

    # Mark messages as read
    messages_col.update_many(
        {"from": partner, "to": user, "read": False},
        {"$set": {"read": True}}
    )

    for m in msgs:
        m["_id"] = str(m["_id"])

    return jsonify(msgs)


# ── POST send a message (REST fallback — WebSocket is primary)
@messages_bp.route("/messages", methods=["POST"])
def send_message():
    data = request.json
    msg = {
        "from": data.get("from"),
        "to": data.get("to"),
        "text": data.get("text"),
        "itemTitle": data.get("itemTitle", ""),
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    }
    result = messages_col.insert_one(msg)
    msg["_id"] = str(result.inserted_id)
    return jsonify(msg)


# ── SOCKET.IO event handlers (registered in app.py)
def register_socket_events(socketio):

    @socketio.on("join")
    def on_join(data):
        user = data.get("user")
        partner = data.get("partner")
        room = room_id(user, partner)
        join_room(room)

    @socketio.on("leave")
    def on_leave(data):
        user = data.get("user")
        partner = data.get("partner")
        room = room_id(user, partner)
        leave_room(room)

    @socketio.on("send_message")
    def on_message(data):
        msg = {
            "from": data.get("from"),
            "to": data.get("to"),
            "text": data.get("text"),
            "itemTitle": data.get("itemTitle", ""),
            "timestamp": datetime.utcnow().isoformat(),
            "read": False
        }
        result = messages_col.insert_one(msg)
        msg["_id"] = str(result.inserted_id)

        # Emit to the shared room so both users get it instantly
        room = room_id(msg["from"], msg["to"])
        emit("receive_message", msg, room=room)