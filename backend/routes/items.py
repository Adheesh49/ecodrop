from flask import Blueprint, request, jsonify
from utils.db import items
from bson import ObjectId

items_bp = Blueprint("items", __name__)


# GET ALL ITEMS
@items_bp.route("/items", methods=["GET"])
def get_items():
    all_items = []

    # EDIT: fetch items that are available OR have no status field
    # (covers items added before the status field was introduced)
    query = {
        "$or": [
            {"status": "available"},
            {"status": {"$exists": False}}
        ]
    }

    for item in items.find(query):
        item["_id"] = str(item["_id"])
        all_items.append(item)

    return jsonify(all_items)


# GET SINGLE ITEM BY ID
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
        "condition": data.get("condition", "used"),
        "location": data.get("location", ""),
        "originalValue": data.get("originalValue", ""),
        "tags": data.get("tags", []),
        "images": data.get("images", []),
        "owner": data.get("owner"),       # stored as name string e.g. "Adheesh"
        "status": "available",
        "views": 0,
        "likes": 0,
    }

    result = items.insert_one(new_item)
    return jsonify({"message": "Item added", "id": str(result.inserted_id)})


# DELETE ITEM — only the owner should call this (enforced on frontend too)
@items_bp.route("/items/<id>", methods=["DELETE"])
def delete_item(id):
    # EDIT: check that the requester is the owner before deleting
    owner = request.args.get("owner")
    item = items.find_one({"_id": ObjectId(id)})

    if not item:
        return jsonify({"message": "Item not found"}), 404

    if owner and item.get("owner") != owner:
        return jsonify({"message": "Not authorised"}), 403

    items.delete_one({"_id": ObjectId(id)})
    return jsonify({"message": "Item removed"})


# ONE-TIME MIGRATION: patch old items that have no status field
@items_bp.route("/items/migrate", methods=["POST"])
def migrate_items():
    result = items.update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "available", "views": 0, "likes": 0}}
    )
    return jsonify({"message": f"Updated {result.modified_count} items"})