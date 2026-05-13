from flask import Blueprint, request, jsonify
from utils.db import db
from bson import ObjectId
from datetime import datetime

orders_bp = Blueprint("orders", __name__)
orders_col = db["orders"]
users_col = db["users"]
messages_col = db["messages"]

# ── CREATE ORDER
@orders_bp.route("/orders", methods=["POST"])
def create_order():
    data = request.json
    order = {
        "itemId": data.get("itemId"),
        "itemTitle": data.get("itemTitle"),
        "itemOwner": data.get("itemOwner"),
        "requestedBy": data.get("requestedBy"),
        "deliveryType": data.get("deliveryType"),  # "delivery" or "self-collect"
        "address": data.get("address", {}),
        "phone": data.get("phone", ""),
        "status": "Order Placed",
        "courierId": None,
        "courierName": None,
        "statusHistory": [
            {"status": "Order Placed", "time": datetime.utcnow().isoformat()}
        ],
        "createdAt": datetime.utcnow().isoformat(),
    }
    result = orders_col.insert_one(order)
    order["_id"] = str(result.inserted_id)

    # Notify item owner
    messages_col.insert_one({
        "from": "EcoDrop",
        "to": data.get("itemOwner"),
        "text": f"📦 New order placed for your item '{data.get('itemTitle')}' by {data.get('requestedBy')}. Delivery type: {data.get('deliveryType')}.",
        "itemTitle": data.get("itemTitle"),
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    })

    return jsonify(order)


# ── GET ALL ORDERS (courier dashboard + admin)
@orders_bp.route("/orders", methods=["GET"])
def get_orders():
    all_orders = []
    for o in orders_col.find().sort("createdAt", -1):
        o["_id"] = str(o["_id"])
        all_orders.append(o)
    return jsonify(all_orders)


# ── GET ORDERS BY USER
@orders_bp.route("/orders/user/<username>", methods=["GET"])
def get_user_orders(username):
    user_orders = []
    for o in orders_col.find({"requestedBy": username}).sort("createdAt", -1):
        o["_id"] = str(o["_id"])
        user_orders.append(o)
    return jsonify(user_orders)


# ── GET ORDERS FOR COURIER
@orders_bp.route("/orders/courier/<courier_name>", methods=["GET"])
def get_courier_orders(courier_name):
    courier_orders = []
    for o in orders_col.find({"courierName": courier_name}).sort("createdAt", -1):
        o["_id"] = str(o["_id"])
        courier_orders.append(o)
    return jsonify(courier_orders)


# ── COURIER CLAIMS ORDER (first come first serve)
@orders_bp.route("/orders/<id>/claim", methods=["POST"])
def claim_order(id):
    data = request.json
    order = orders_col.find_one({"_id": ObjectId(id)})

    if not order:
        return jsonify({"message": "Order not found"}), 404

    if order.get("courierId"):
        return jsonify({"message": "Order already claimed"}), 400

    now = datetime.utcnow().isoformat()
    orders_col.update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "courierId": data.get("courierId"),
            "courierName": data.get("courierName"),
            "status": "Courier Assigned",
        },
        "$push": {
            "statusHistory": {"status": "Courier Assigned", "time": now}
        }}
    )
    return jsonify({"message": "Order claimed successfully"})


# ── UPDATE ORDER STATUS
@orders_bp.route("/orders/<id>/status", methods=["POST"])
def update_status(id):
    data = request.json
    new_status = data.get("status")

    valid_statuses = [
        "Order Placed",
        "Courier Assigned",
        "Out for Pickup",
        "Picked Up",
        "Out for Delivery",
        "Delivered"
    ]

    if new_status not in valid_statuses:
        return jsonify({"message": "Invalid status"}), 400

    now = datetime.utcnow().isoformat()
    orders_col.update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {"status": new_status},
            "$push": {"statusHistory": {"status": new_status, "time": now}}
        }
    )
    return jsonify({"message": "Status updated"})


# ── ADMIN: GET ALL COURIERS
@orders_bp.route("/couriers", methods=["GET"])
def get_couriers():
    couriers = []
    for u in users_col.find({"role": "courier"}):
        u["_id"] = str(u["_id"])
        u.pop("password", None)
        u.pop("securityAnswer", None)
        couriers.append(u)
    return jsonify(couriers)


# ── ADMIN: ASSIGN COURIER TO ORDER
@orders_bp.route("/orders/<id>/assign", methods=["POST"])
def assign_courier(id):
    data = request.json
    now = datetime.utcnow().isoformat()
    orders_col.update_one(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "courierId": data.get("courierId"),
                "courierName": data.get("courierName"),
                "status": "Courier Assigned"
            },
            "$push": {
                "statusHistory": {"status": "Courier Assigned", "time": now}
            }
        }
    )
    return jsonify({"message": "Courier assigned"})

# ADD these two routes — admin prefixed versions
@orders_bp.route("/admin/orders", methods=["GET"])
def get_all_orders_admin():
    all_orders = []
    for o in orders_col.find().sort("createdAt", -1):
        o["_id"] = str(o["_id"])
        all_orders.append(o)
    return jsonify(all_orders)

@orders_bp.route("/admin/couriers", methods=["GET"])
def get_couriers_admin():
    couriers = []
    for u in users_col.find({"role": "courier"}):
        u["_id"] = str(u["_id"])
        u.pop("password", None)
        u.pop("securityAnswer", None)
        couriers.append(u)
    return jsonify(couriers)