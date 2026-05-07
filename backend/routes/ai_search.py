from flask import Blueprint, request, jsonify
import anthropic
import json
import os
import traceback

ai_bp = Blueprint("ai", __name__)

# Load Anthropic client
client = anthropic.Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY")
)

# =========================
# AI TEXT SEARCH
# =========================
@ai_bp.route("/ai/search", methods=["POST"])
def ai_text_search():
    try:
        data = request.json

        query = data.get("query", "")
        items = data.get("items", [])

        if not query or not items:
            return jsonify({"ids": []})

        catalog = json.dumps(items)

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            messages=[
                {
                    "role": "user",
                    "content": f"""
You are a smart AI search engine.

User search:
"{query}"

Catalog:
{catalog}

Return ONLY a JSON array of matching item IDs.

Example:
["1","2"]

No markdown.
No explanation.
Only JSON array.
"""
                }
            ]
        )

        text = message.content[0].text.strip()

        # Clean markdown if Claude adds it
        text = text.replace("```json", "").replace("```", "").strip()

        try:
            ids = json.loads(text)
        except Exception:
            print("Invalid AI response:", text)
            ids = []

        return jsonify({"ids": ids})

    except Exception:
        traceback.print_exc()
        return jsonify({"ids": []})


# =========================
# AI IMAGE SEARCH
# =========================
@ai_bp.route("/ai/image-search", methods=["POST"])
def ai_image_search():
    try:
        data = request.json

        image_data = data.get("image", "")
        media_type = data.get("mediaType", "image/jpeg")
        items = data.get("items", [])

        if not image_data or not items:
            return jsonify({"ids": []})

        catalog = json.dumps(items)

        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=300,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": image_data
                            }
                        },
                        {
                            "type": "text",
                            "text": f"""
The user uploaded an image.

Find matching items from this catalog:
{catalog}

Return ONLY a JSON array of matching item IDs.

Example:
["1","2"]

No markdown.
No explanation.
Only JSON array.
"""
                        }
                    ]
                }
            ]
        )

        text = message.content[0].text.strip()

        text = text.replace("```json", "").replace("```", "").strip()

        try:
            ids = json.loads(text)
        except Exception:
            print("Invalid AI image response:", text)
            ids = []

        return jsonify({"ids": ids})

    except Exception:
        traceback.print_exc()
        return jsonify({"ids": []})