from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from utils.db import users
import bcrypt
import os
from routes.admin import admin_bp

from routes.items import items_bp
from routes.messages import messages_bp, register_socket_events

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "ecodrop-secret-key")

# FIX: use exact Vercel URL instead of wildcard
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
    "https://ecodrop-b69t.vercel.app"
]}})

# FIX: use exact Vercel URL instead of wildcard
socketio = SocketIO(app, cors_allowed_origins=[
    "http://localhost:3000",
    "https://ecodrop-b69t.vercel.app"
])

# REGISTER BLUEPRINTS
app.register_blueprint(items_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(admin_bp)

# REGISTER WEBSOCKET EVENT HANDLERS
register_socket_events(socketio)


# HOME ROUTE
@app.route("/")
def home():
    return jsonify({"message": "Ecodrop API running"})

# app route
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    security_question = data.get("securityQuestion", "")
    security_answer = data.get("securityAnswer", "").lower().strip()

    if not name or not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    if not security_question or not security_answer:
        return jsonify({"message": "Security question and answer are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    hashed_answer = bcrypt.hashpw(security_answer.encode("utf-8"), bcrypt.gensalt())

    new_user = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_password,
        "role": "user",
        "securityQuestion": security_question,
        "securityAnswer": hashed_answer
    }

    users.insert_one(new_user)
    return jsonify({"message": "Registration successful"})

# LOGIN USER
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = users.find_one({"email": email})

    if not user:
        return jsonify({"message": "User not found"}), 404

    if bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({
            "message": "Login successful",
            "name": user["name"],
            "role": user["role"]
        })

    return jsonify({"message": "Incorrect password"}), 401

# GET security question by email
@app.route("/forgot-password/question", methods=["POST"])
def get_security_question():
    data = request.json
    email = data.get("email", "").strip()

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "No account found with this email"}), 404

    if not user.get("securityQuestion"):
        return jsonify({"message": "This account has no security question set"}), 400

    return jsonify({"question": user["securityQuestion"]})


# VERIFY answer and reset password
@app.route("/forgot-password/reset", methods=["POST"])
def reset_password():
    data = request.json
    email = data.get("email", "").strip()
    answer = data.get("answer", "").lower().strip()
    new_password = data.get("newPassword", "")

    if not email or not answer or not new_password:
        return jsonify({"message": "All fields are required"}), 400

    if len(new_password) < 6:
        return jsonify({"message": "Password must be at least 6 characters"}), 400

    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "No account found with this email"}), 404

    # Verify security answer
    if not bcrypt.checkpw(answer.encode("utf-8"), user["securityAnswer"]):
        return jsonify({"message": "Incorrect answer. Please try again."}), 401

    # Hash and update new password
    hashed = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
    users.update_one({"email": email}, {"$set": {"password": hashed}})

    return jsonify({"message": "Password reset successful! You can now login."})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=False, host="0.0.0.0", port=port)