# Excel Import Setup Instructions

## Prerequisites

Before running the import, you need to:

### 1. Add Supabase Service Role Key

The import script needs admin access to bypass RLS policies. Add this to `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**To get your service role key:**
1. Go to https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/settings/api
2. Copy the `service_role` key (secret) from the **Project API keys** section
3. Add it to `.env.local`

⚠️ **IMPORTANT:** Never commit this key to git. It bypasses all security policies.

### 2. Apply Database Migration

Run the purchase_items migration in Supabase SQL Editor:

1. Go to https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new
2. Copy contents of `supabase-purchase-items-migration.sql`
3. Paste and execute
4. Verify table created: go to Table Editor → purchase_items

### 3. Prepare Excel File

Place your Excel file at:
```
/Users/alexis/Desktop/Villa-Sere-admin-main/data/inventory_villa_serena.xlsx
```

The script expects 3 sheets:
- **DINNER WARE INVENTOR**: Columns: ITEM, AMOUNT, LOCATION
- **TOBUY**: Area headers (MASTER, KITCHEN, etc.) followed by items
- **CAMBIOS Y REPARACIONES**: Room headers followed by repair descriptions

## Running the Import

Once setup is complete:

```bash
npm run import:inventory
```

## What the Script Does

1. **Inventory Items** (Sheet 1):
   - Maps ITEM → name, AMOUNT → quantity, LOCATION → location
   - Sets category to "Dinnerware"
   - Upserts by (name, location, category) - safe to re-run
   - Sets min_quantity to 20% of current stock

2. **Purchase Items** (Sheet 2):
   - Parses area headers (MASTER, KITCHEN, etc.)
   - Extracts item name, quantity, estimated cost, link
   - Upserts by (area, item) - safe to re-run
   - Sets status to "to_buy" by default

3. **Maintenance Tickets** (Sheet 3):
   - Parses room headers
   - Creates tickets with title and description
   - Skips duplicates (same title + room)
   - Sets status to "pending", priority to "medium"

## Verifying Results

After import completes:
1. Start the app: `npm run dev`
2. Open http://localhost:3000
3. Check:
   - Inventory page: Should show imported dinnerware items
   - To Buy page: Should show all purchase items with area groupings
   - Maintenance page: Should show imported repair tickets

## Troubleshooting

**"Missing Supabase credentials" error:**
- Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`

**"Excel file not found" error:**
- Verify file path: `/Users/alexis/Desktop/Villa-Sere-admin-main/data/inventory_villa_serena.xlsx`
- Create `data/` folder if needed: `mkdir data`

**Database errors:**
- Run the purchase_items migration first
- Check Supabase dashboard for error details

**Duplicate entries:**
- Script is idempotent - safe to re-run
- Inventory: upserts by (name, location, category)
- Purchases: upserts by (area, item)
- Maintenance: skips exact duplicates

## Import Summary

The script will output:
```
✅ Import Complete!
================================================
📦 Inventory Items: X upserted
🛒 Purchase Items: Y upserted
🔧 Maintenance Tickets: Z inserted
```
