#!/usr/bin/env python3
"""
Automated Schema Deployment for Villa Sere
"""
import os
import requests

SUPABASE_URL = "https://euxgrvunyghbpenkcgwh.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGdydnVueWdoYnBlbmtjZ3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MTYsImV4cCI6MjA4MjA0NTcxNn0.cpb17DvRzHlEdqCyOdmporKVZzxpetOTnB9jFYQgp-k"

print("=" * 50)
print("🏡 Villa Sere - Schema Deployment")
print("=" * 50)
print()

# Read schema
with open('supabase-schema.sql', 'r') as f:
    schema = f.read()

print("📄 Schema loaded successfully")
print(f"   Size: {len(schema)} characters")
print()

# Try to test connection
print("🔍 Testing Supabase connection...")
headers = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}"
}

try:
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/",
        headers=headers,
        timeout=5
    )
    print("✅ Connection successful!")
except Exception as e:
    print(f"⚠️  Connection test: {e}")

print()
print("=" * 50)
print("📋 MANUAL DEPLOYMENT REQUIRED")
print("=" * 50)
print()
print("The schema must be deployed via Supabase Dashboard:")
print()
print("1. Open: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new")
print()
print("2. Copy and paste the following SQL:")
print()
print("-" * 50)
print(schema)
print("-" * 50)
print()
print("3. Click the RUN button")
print()
print("4. Wait for SUCCESS message")
print()
print("=" * 50)
print()
print("💡 Tip: You can also run:")
print("   cat supabase-schema.sql | pbcopy    (macOS)")
print("   cat supabase-schema.sql | xclip     (Linux)")
print()

