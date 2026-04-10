from flask import Blueprint, jsonify, request
from utils.db import db
from bson import ObjectId

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