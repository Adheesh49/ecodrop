from flask import Blueprint, jsonify, request
from utils.db import db
from bson import ObjectId
import bcrypt

admin_bp = Blueprint("admin", __name__)
users_col = db["users"]
items_col = db["items"]

# GET all users
@admin_bp.route("/admin/users", methods=["GET"])
def get_all_users():
    users = []
    for u in users_col.find():
        u["_id"] = str(u["_id"])
        u.pop("password", None)  # never send password
        users.append(u)
    return jsonify(users)

# DELETE a user
@admin_bp.route("/admin/users/<id>", methods=["DELETE"])
def delete_user(id):
    users_col.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "User deleted"})

# GET all items (including taken)
@admin_bp.route("/admin/items", methods=["GET"])
def get_all_items():
    items = []
    for i in items_col.find():
        i["_id"] = str(i["_id"])
        items.append(i)
    return jsonify(items)

# DELETE any item
@admin_bp.route("/admin/items/<id>", methods=["DELETE"])
def delete_item(id):
    items_col.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Item deleted"})

# ADD THIS ROUTE
@admin_bp.route("/admin/users/<id>/reset-password", methods=["POST"])
def reset_password(id):
    data = request.json
    new_password = data.get("password", "")

    if not new_password or len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
    users_col.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"password": hashed}}
    )
    return jsonify({"message": "Password updated successfully"})