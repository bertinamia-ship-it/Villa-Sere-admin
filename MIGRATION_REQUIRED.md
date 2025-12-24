# ⚠️ CRITICAL: Apply Migration Before Import

The import script is ready, but **you must first create the `purchase_items` table** in Supabase.

## Step 1: Apply the Migration (Required!)

1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new
2. Copy the entire contents of: `supabase-purchase-items-migration.sql`
3. Paste into Supabase SQL Editor
4. Click **Run**
5. You should see: "Query executed successfully"

## Step 2: Verify Table Created

1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/editor
2. Look for `purchase_items` table in the left sidebar
3. Click it to confirm it exists with columns: id, area, item, quantity, est_cost, link, status, notes, created_at, updated_at, created_by

## Step 3: Run Import

Once the migration is applied:

```bash
npm run import:inventory
```

This will import all data from your Excel file into the three tables:
- **Inventory items** (DINNER WARE INVENTOR sheet)
- **Purchase items** (TOBUY sheet) - requires the migration to be applied first
- **Maintenance tickets** (CAMBIOS Y REPARACIONES sheet)

---

**Without this migration, the import will fail when trying to write to purchase_items!**
