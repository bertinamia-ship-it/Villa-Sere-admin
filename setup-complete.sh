#!/bin/bash

# Villa Sere - Complete Setup Script
# This script will guide you through the complete setup process

set -e

echo "========================================="
echo "🏡 Villa Sere - Complete Setup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Environment Check
echo -e "${YELLOW}Step 1: Checking environment...${NC}"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local exists${NC}"
else
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Manual Schema Deployment
echo ""
echo "========================================="
echo -e "${YELLOW}Step 3: Deploy Database Schema${NC}"
echo "========================================="
echo ""
echo "📋 Please complete these manual steps:"
echo ""
echo "1️⃣  Open: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new"
echo ""
echo "2️⃣  Copy the SQL from: supabase-schema.sql"
echo "    You can also run: cat supabase-schema.sql"
echo ""
echo "3️⃣  Paste into SQL Editor and click RUN"
echo ""
read -p "Press ENTER when schema is deployed..."
echo ""

# Step 4: Storage Bucket
echo "========================================="
echo -e "${YELLOW}Step 4: Create Storage Bucket${NC}"
echo "========================================="
echo ""
echo "🪣 Please complete these steps:"
echo ""
echo "1️⃣  Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/storage/buckets"
echo ""
echo "2️⃣  Click 'New bucket'"
echo "    - Name: attachments"
echo "    - Public: OFF"
echo "    - Click 'Create bucket'"
echo ""
echo "3️⃣  Click 'attachments' → 'Policies' → 'New Policy'"
echo "    - Select template: 'Allow all operations for authenticated users'"
echo "    - Click 'Review' → 'Save policy'"
echo ""
read -p "Press ENTER when storage is configured..."
echo ""

# Step 5: Verify Setup
echo -e "${YELLOW}Step 5: Verifying setup...${NC}"
node setup-supabase.js
echo ""

# Step 6: Test Build
echo -e "${YELLOW}Step 6: Testing production build...${NC}"
npm run build
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 7: Start Dev Server
echo "========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "========================================="
echo ""
echo "🚀 To start development server:"
echo "   npm run dev"
echo ""
echo "🌐 Then open: http://localhost:3000"
echo ""
echo "👤 Create your first user at: /signup"
echo ""
echo "📦 To deploy to Vercel:"
echo "   npm run build && npx vercel"
echo ""
echo "========================================="
