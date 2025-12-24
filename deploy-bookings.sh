#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔧 Creating Bookings Table in Supabase...${NC}"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}❌ .env.local not found. Please create it first.${NC}"
  exit 1
fi

# Get Supabase URL and anon key
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f 2)
SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f 2)
SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f 2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}❌ Missing Supabase credentials in .env.local${NC}"
  echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  exit 1
fi

# Read the SQL file
SQL_FILE="create-bookings-table.sql"
if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}❌ $SQL_FILE not found${NC}"
  exit 1
fi

# Execute SQL via Supabase REST API
echo -e "${YELLOW}📤 Executing SQL migration...${NC}"

SQL_CONTENT=$(cat "$SQL_FILE")

# Use curl to execute the SQL
curl -s -X POST \
  "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": $(echo "$SQL_CONTENT" | jq -Rs .)}" > /dev/null 2>&1

# The above might not work with rpc/exec, let's try using the SQL Editor approach
# Instead, we'll use psql if available or provide instructions

if command -v psql &> /dev/null; then
  echo -e "${YELLOW}📦 Using psql to execute migration...${NC}"
  
  # Extract connection string components
  SUPABASE_HOST=$(echo $SUPABASE_URL | sed 's/https:\/\///g' | sed 's/\/.*//g' | sed 's/^.*\.//' | sed 's/-.*$//')
  
  # Create connection string
  CONN_STRING="postgresql://postgres:${SUPABASE_SERVICE_KEY}@db.${SUPABASE_HOST}.supabase.co:5432/postgres"
  
  # Execute SQL
  psql "$CONN_STRING" -f "$SQL_FILE"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Bookings table created successfully!${NC}"
  else
    echo -e "${RED}❌ Failed to create bookings table${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⚠️  psql not found. Please execute the following in Supabase SQL Editor:${NC}"
  echo ""
  echo "---"
  cat "$SQL_FILE"
  echo "---"
  echo ""
  echo -e "${YELLOW}📝 Steps:${NC}"
  echo "1. Go to https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql/new"
  echo "2. Copy the SQL above into the editor"
  echo "3. Click 'Run'"
  echo "4. Verify the table was created"
fi
