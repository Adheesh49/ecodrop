import sys
sys.path.append("/Users/adheesh/ecodrop/backend")

print("Loading env...")
from dotenv import load_dotenv
import os
load_dotenv("/Users/adheesh/ecodrop/backend/.env")

print("Configuring Cloudinary...")
import cloudinary
import cloudinary.uploader
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET")
)

print("Connecting to MongoDB...")
from utils.db import db
items_col = db["items"]

print("Fetching items...")
items = list(items_col.find({"images": {"$exists": True, "$ne": []}}))
print(f"Found {len(items)} items to migrate")

for item in items:
    new_urls = []
    changed = False
    print(f"Processing: {item.get('title', 'unknown')}...")

    for img in item.get("images", []):
        if img.startswith("data:image"):
            try:
                print(f"  Uploading image ({len(img)//1024}KB)...")
                result = cloudinary.uploader.upload(img, timeout=60)
                new_urls.append(result["secure_url"])
                changed = True
                print(f"  ✅ Done")
            except Exception as e:
                print(f"  ❌ Failed: {e}")
                new_urls.append(img)
        else:
            print(f"  ⏭ Already a URL, skipping")
            new_urls.append(img)

    if changed:
        items_col.update_one(
            {"_id": item["_id"]},
            {"$set": {"images": new_urls}}
        )
        print(f"✅ Updated in MongoDB: {item.get('title')}")

print("Migration complete!")