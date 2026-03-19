from flask import Blueprint, request, jsonify
from utils.db import items
from bson import ObjectId

items_bp = Blueprint("items", __name__)

# GET ALL ITEMS
@items_bp.route("/items", methods=["GET"])
def get_items():
    all_items = []

    for item in items.find({"status": "available"}):
        item["_id"] = str(item["_id"])
        all_items.append(item)

    return jsonify(all_items)


# EDIT: GET SINGLE ITEM BY ID — needed for the item detail page
@items_bp.route("/items/<id>", methods=["GET"])
def get_item(id):
    item = items.find_one({"_id": ObjectId(id)})

    if not item:
        return jsonify({"message": "Item not found"}), 404

    item["_id"] = str(item["_id"])
    return jsonify(item)


# ADD ITEM
@items_bp.route("/items", methods=["POST"])
def add_item():
    data = request.json

    new_item = {
        "title": data.get("title"),
        "description": data.get("description"),
        "category": data.get("category"),
        "condition": data.get("condition", "used"),  # EDIT: added condition field
        "images": data.get("images", []),
        "owner": data.get("owner"),
        "status": "available"
    }

    result = items.insert_one(new_item)

    return jsonify({"message": "Item added", "id": str(result.inserted_id)})


# DELETE ITEM (when taken)
@items_bp.route("/items/<id>", methods=["DELETE"])
def delete_item(id):
    items.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Item removed"})