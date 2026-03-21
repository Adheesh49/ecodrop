import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

try:
    client = MongoClient(
        MONGO_URI,
        tlsCAFile=certifi.where()
    )
    # Test the connection
    client.admin.command('ping')
    print("MongoDB connected successfully")
except Exception as e:
    print(f"MongoDB connection error: {e}")
    # Fallback with TLS verification disabled
    client = MongoClient(
        MONGO_URI,
        tls=True,
        tlsAllowInvalidCertificates=True
    )

db = client["ecodrop"]

users = db["users"]
items = db["items"]
bookings = db["bookings"]
reviews = db["reviews"]
messages = db["messages"]