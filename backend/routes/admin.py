from flask import Blueprint, jsonify, request
from utils.db import db
from bson import ObjectId
import bcrypt

admin_bp = Blueprint("admin", __name__)
users_col = db["users"]
items_col = db["items"]

def sanitize_doc(doc):
    doc["_id"] = str(doc["_id"])
    for key, val in list(doc.items()):
        if isinstance(val, bytes):
            doc.pop(key)
    return doc

# GET all users
@admin_bp.route("/admin/users", methods=["GET"])
def get_all_users():
    users = []
    for u in list(users_col.find()):
        u.pop("password", None)
        u = sanitize_doc(u)
        users.append(u)
    return jsonify(users)

# DELETE a user
@admin_bp.route("/admin/users/<id>", methods=["DELETE"])
def delete_user(id):
    users_col.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "User deleted"})

# GET all items
@admin_bp.route("/admin/items", methods=["GET"])
def get_all_items():
    raw = list(items_col.find())
    items = [sanitize_doc(i) for i in raw]
    return jsonify(items)

# DELETE any item
@admin_bp.route("/admin/items/<id>", methods=["DELETE"])
def delete_item(id):
    items_col.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Item deleted"})

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

@admin_bp.route("/admin/users/<id>/role", methods=["POST"])
def update_role(id):
    data = request.json
    new_role = data.get("role")
    if new_role not in ["user", "courier", "admin"]:
        return jsonify({"message": "Invalid role"}), 400
    users_col.update_one({"_id": ObjectId(id)}, {"$set": {"role": new_role}})
    return jsonify({"message": f"Role updated to {new_role}"})