import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

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