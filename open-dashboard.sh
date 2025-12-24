#!/bin/bash

# Villa Sere - Quick Deploy Helper
# Opens all necessary URLs for manual setup

echo "🏡 Opening Supabase Dashboard pages..."
echo ""

# SQL Editor
echo "Opening SQL Editor..."
$BROWSER "https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new" &
sleep 1

# Storage
echo "Opening Storage..."
$BROWSER "https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/storage/buckets" &
sleep 1

# Local app
echo "Opening Local App..."
$BROWSER "http://localhost:3000" &

echo ""
echo "========================================="
echo "✅ Opened 3 tabs:"
echo "========================================="
echo "1. SQL Editor - Paste schema and click RUN"
echo "2. Storage - Create 'attachments' bucket"
echo "3. Local App - Test the application"
echo ""
echo "📋 Schema file: supabase-schema.sql"
echo "   Run: cat supabase-schema.sql"
echo ""
echo "========================================="
