import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")

# All TLS settings handled via connection string
client = MongoClient(MONGO_URI)

db = client["ecodrop"]

users = db["users"]
items = db["items"]
bookings = db["bookings"]
reviews = db["reviews"]
messages = db["messages"]