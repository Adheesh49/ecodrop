from flask import Flask, jsonify, request
from flask_cors import CORS
from utils.db import users
import bcrypt

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return {"message": "Ecodrop API running"}

# TEST ROUTE (optional)
@app.route("/add-test-user")
def add_test_user():
    test_user = {
        "name": "Adheesh",
        "email": "adheesh@example.com"
    }

    users.insert_one(test_user)

    return jsonify({"message": "Test user added"})


# -----------------------------
# REGISTER USER
# -----------------------------
@app.route("/register", methods=["POST"])
def register():

    data = request.json

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    # check if email already exists
    if users.find_one({"email": email}):
        return jsonify({"message": "User already exists"}), 400

    # hash password
    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    new_user = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": hashed_password,
        "role": "user"   # default role
    }

    users.insert_one(new_user)

    return jsonify({"message": "Registration successful"})


# -----------------------------
# LOGIN USER
# -----------------------------
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
    app.run(debug=True, port=5000)