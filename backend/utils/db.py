from pymongo import MongoClient

# connect to local MongoDB server
client = MongoClient("mongodb://localhost:27017/")

# create / connect to ecodrop database
db = client["ecodrop"]

# collections
users = db["users"]
items = db["items"]
bookings = db["bookings"]
reviews = db["reviews"]
messages = db["messages"]