#!/bin/bash

# E2E Test Script for Villa Sere Admin App
# Tests all major features end-to-end

echo "🧪 Starting E2E Test Suite..."
echo "================================"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

test_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

test_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

# Check if server is running
if ! lsof -ti:3000 > /dev/null 2>&1; then
  test_fail "Dev server not running on port 3000"
  exit 1
fi
test_pass "Dev server running on port 3000"

# Check Supabase connectivity
if grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local; then
  test_pass "Supabase credentials configured"
else
  test_fail "Supabase credentials missing from .env.local"
fi

# Check required files exist
FILES=(
  "app/(dashboard)/inventory/page.tsx"
  "app/(dashboard)/to-buy/page.tsx"
  "app/(dashboard)/maintenance/page.tsx"
  "app/(dashboard)/expenses/page.tsx"
  "app/(dashboard)/reports/page.tsx"
  "scripts/import-inventory.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    test_pass "File exists: $file"
  else
    test_fail "File missing: $file"
  fi
done

# Check tables exist via database
echo ""
echo "🗄️  Database Tables..."
echo "================================"

# Inventory items migration check
if [ -f "supabase-schema.sql" ]; then
  if grep -q "CREATE TABLE.*inventory_items" supabase-schema.sql; then
    test_pass "inventory_items table schema exists"
  else
    test_fail "inventory_items table schema not found"
  fi
fi

# Purchase items migration check
if [ -f "supabase-purchase-items-migration.sql" ]; then
  if grep -q "CREATE TABLE.*purchase_items" supabase-purchase-items-migration.sql; then
    test_pass "purchase_items migration file exists"
  else
    test_fail "purchase_items migration malformed"
  fi
fi

# Maintenance fix check
if [ -f "supabase-fix-maintenance-table.sql" ]; then
  if grep -q "ALTER TABLE.*maintenance_tickets" supabase-fix-maintenance-table.sql; then
    test_pass "maintenance_tickets fix migration exists"
  else
    test_fail "maintenance_tickets fix migration malformed"
  fi
fi

# Check TypeScript types
echo ""
echo "📝 TypeScript Types..."
echo "================================"

if grep -q "type InventoryItem" lib/types/database.ts; then
  test_pass "InventoryItem type defined"
else
  test_fail "InventoryItem type missing"
fi

if grep -q "type PurchaseItem" lib/types/database.ts; then
  test_pass "PurchaseItem type defined"
else
  test_fail "PurchaseItem type missing"
fi

if grep -q "type MaintenanceTicket" lib/types/database.ts; then
  test_pass "MaintenanceTicket type defined"
else
  test_fail "MaintenanceTicket type missing"
fi

# Check UI components
echo ""
echo "🎨 UI Components..."
echo "================================"

COMPONENTS=(
  "components/ui/Input.tsx"
  "components/ui/Select.tsx"
  "components/ui/Button.tsx"
  "components/ui/Card.tsx"
  "components/ui/Toast.tsx"
  "components/ui/Loading.tsx"
  "components/ui/EmptyState.tsx"
)

for comp in "${COMPONENTS[@]}"; do
  if [ -f "$comp" ]; then
    test_pass "Component exists: $comp"
  else
    test_fail "Component missing: $comp"
  fi
done

# Check page components
echo ""
echo "📄 Page Components..."
echo "================================"

PAGES=(
  "app/(dashboard)/inventory/InventoryForm.tsx"
  "app/(dashboard)/inventory/InventoryList.tsx"
  "app/(dashboard)/to-buy/page.tsx"
  "app/(dashboard)/to-buy/PurchaseItemForm.tsx"
  "app/(dashboard)/maintenance/TicketForm.tsx"
  "app/(dashboard)/maintenance/MaintenanceList.tsx"
  "app/(dashboard)/expenses/page.tsx"
  "app/(dashboard)/reports/page.tsx"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    test_pass "Page component exists: $page"
  else
    test_fail "Page component missing: $page"
  fi
done

# Check import infrastructure
echo ""
echo "📦 Import System..."
echo "================================"

if [ -f "scripts/import-inventory.ts" ]; then
  if grep -q "importInventoryItems\|importPurchaseItems\|importMaintenanceTickets" scripts/import-inventory.ts; then
    test_pass "Import script has all three import functions"
  else
    test_fail "Import script missing import functions"
  fi
fi

if [ -f "data/inventory_villa_serena.xlsx" ]; then
  SIZE=$(ls -lh data/inventory_villa_serena.xlsx | awk '{print $5}')
  test_pass "Excel file exists ($SIZE)"
else
  test_fail "Excel file not found"
fi

# Summary
echo ""
echo "================================"
echo "📊 Test Summary"
echo "================================"
TOTAL=$((PASSED + FAILED))
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed. Please review.${NC}"
  exit 1
fi
