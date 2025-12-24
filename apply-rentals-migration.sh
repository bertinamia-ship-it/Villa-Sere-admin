#!/bin/bash

# Apply rentals migration to Supabase
# Run this script to add the bookings table

echo "🔄 Applying rentals migration..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local file not found"
  echo "Please create .env.local with your Supabase credentials"
  exit 1
fi

# Source the environment variables
source .env.local

# Check if required variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Missing Supabase credentials"
  echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  exit 1
fi

# Apply the migration
echo "📤 Sending migration to Supabase..."

curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @supabase-rentals-migration.sql

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Verify the bookings table was created in Supabase dashboard"
echo "2. Test the Rentals page at /rentals"
echo "3. Add a test booking"
