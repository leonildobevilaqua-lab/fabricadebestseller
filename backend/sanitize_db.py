
import json
import re
import os

db_path = r"c:/Users/Pichau/Downloads/bestseller-factory-ai/backend/database.json"

def mask_secrets(data_str):
    # More aggressive patterns
    patterns = [
        (r'sk-[a-zA-Z0-9]{32,}', "[MASKED_OPENAI]"),
        (r'AIzaSy[a-zA-Z0-9_-]{33}', "[MASKED_GOOGLE]"),
        (r'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}', "[MASKED_SENDGRID]"),
        (r'xkeysib-[a-f0-9]{64}-[a-zA-Z0-9]{16}', "[MASKED_BREVO]"),
    ]
    
    modified = False
    for pattern, replacement in patterns:
        if re.search(pattern, data_str):
            data_str = re.sub(pattern, replacement, data_str)
            modified = True
            
    return data_str, modified

try:
    with open(db_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content, was_modified = mask_secrets(content)
    
    if was_modified:
        with open(db_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully masked secrets in database.json")
    else:
        print("No secrets found to mask.")
        
except Exception as e:
    print(f"Error: {e}")
