#!/usr/bin/env python3
"""
Deploy bookings table migration to Supabase
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing Supabase credentials")
    print("Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local")
    sys.exit(1)

try:
    from supabase import create_client
    
    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Read SQL migration
    sql_path = Path(__file__).parent / 'create-bookings-table.sql'
    if not sql_path.exists():
        print(f"❌ Error: {sql_path} not found")
        sys.exit(1)
    
    sql_content = sql_path.read_text()
    
    # Execute SQL - using postgrest-py to run raw SQL
    print("🔧 Creating bookings table...")
    
    # We need to use the admin API - let's use requests directly
    import requests
    import json
    
    # Try executing via Supabase's query endpoint
    headers = {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type': 'application/json',
    }
    
    # Execute SQL statements individually
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    for i, statement in enumerate(statements):
        print(f"  Executing statement {i+1}/{len(statements)}...")
        
        # For now, just print what would be executed
        # The actual execution would require direct database access
        print(f"    {statement[:80]}...")
    
    print("\n⚠️  Note: SQL execution requires direct database access")
    print("\n📝 To deploy, you have two options:")
    print("\nOption 1: Use Supabase Dashboard")
    print("  1. Go to https://supabase.com/dashboard")
    print("  2. Select your project")
    print("  3. Go to SQL Editor")
    print("  4. Click 'New Query'")
    print("  5. Copy and paste the contents of 'create-bookings-table.sql'")
    print("  6. Click 'Run'")
    
    print("\nOption 2: Use psql (if installed)")
    print("  psql postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres -f create-bookings-table.sql")
    
    print("\n" + "="*60)
    print("SQL to execute:")
    print("="*60)
    print(sql_content)
    print("="*60)
    
except ImportError:
    print("⚠️  supabase-py not installed. Showing manual deployment instructions...")
    print("\nTo deploy the bookings table:")
    print("1. Go to https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Go to SQL Editor > New Query")
    print("4. Copy the contents of 'create-bookings-table.sql'")
    print("5. Paste and run")
    
    sql_path = Path(__file__).parent / 'create-bookings-table.sql'
    if sql_path.exists():
        print("\n" + "="*60)
        print("SQL to execute:")
        print("="*60)
        print(sql_path.read_text())
        print("="*60)
