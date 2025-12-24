#!/bin/bash
# Script to deploy schema to Supabase

echo "========================================="
echo "Deploying Schema to Supabase"
echo "========================================="

# Using curl to execute SQL via Supabase REST API
SUPABASE_URL="https://euxgrvunyghbpenkcgwh.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1eGdydnVueWdoYnBlbmtjZ3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njk3MTYsImV4cCI6MjA4MjA0NTcxNn0.cpb17DvRzHlEdqCyOdmporKVZzxpetOTnB9jFYQgp-k"

echo ""
echo "📋 Schema will be deployed via Supabase SQL Editor"
echo ""
echo "Please follow these steps:"
echo "1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql"
echo "2. Copy the contents of 'supabase-schema.sql'"
echo "3. Paste into the SQL Editor"
echo "4. Click 'Run' to execute"
echo ""
echo "OR use the Supabase CLI:"
echo "  npx supabase db push"
echo ""

