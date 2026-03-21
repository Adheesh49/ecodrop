from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
from utils.db import users
import bcrypt
import os

from routes.items import items_bp
from routes.messages import messages_bp, register_socket_events

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "ecodrop-secret-key")

# FIX: restrict CORS to localhost and Vercel only
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
    "https://*.vercel.app"
]}})

# FIX: restrict SocketIO CORS to localhost and Vercel only
socketio = SocketIO(app, cors_allowed_origins=[
    "http://localhost:3000",
    "https://*.vercel.app"
])

# REGISTER BLUEPRINTS
app.register_blueprint(items_bp)
app.register_blueprint(messages_bp)

# REGISTER WEBSOCKET EVENT HANDLERS
register_socket_events(socketio)


# HOME ROUTE
@app.route("/")
def home():
    return jsonify({"message": "Ecodrop API running"})


# REGISTER USER
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    new_user = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_password,
        "role": "user"
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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, debug=False, host="0.0.0.0", port=port)