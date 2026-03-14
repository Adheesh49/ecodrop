from flask import Flask, jsonify
from utils.db import users  # import the users collection

app = Flask(__name__)

@app.route("/")
def home():
    return {"message": "Ecodrop API running"}

# --- ADD THIS ---
@app.route("/add-test-user")
def add_test_user():
    test_user = {
        "name": "Adheesh",
        "email": "adheesh@example.com"
    }

    # insert into MongoDB
    users.insert_one(test_user)

    return jsonify({"message": "Test user added"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)