
import json

db_path = r"c:/Users/Pichau/Downloads/bestseller-factory-ai/backend/database.json"

def deep_clean(obj):
    if isinstance(obj, dict):
        # Remove common secret key names
        to_del = [k for k in obj.keys() if any(x in k.lower() for x in ['apikey', 'secret', 'password', 'token', 'pass', 'key'])]
        for k in to_del:
            # We don't want to delete EVERYTHING (like 'bookCredits' or 'lastPayment')
            # So let's be more specific or just mask them
            if any(x in k.lower() for x in ['apikey', 'secret', 'token']):
                 obj[k] = "[MASKED]"
        
        for v in obj.values():
            deep_clean(v)
    elif isinstance(obj, list):
        for item in obj:
            deep_clean(item)

try:
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)
    
    deep_clean(db)
    
    with open(db_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, indent=2)
        
    print("Successfully deep cleaned database.json")
except Exception as e:
    print(f"Error: {e}")
