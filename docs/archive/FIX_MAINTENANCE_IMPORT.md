# Fix Maintenance Tickets Import

## Step 1: Apply the Fix Migration

1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new
2. Open and copy the entire contents of: `supabase-fix-maintenance-table.sql`
3. Paste into Supabase SQL Editor
4. Click **Run**

This will:
- ✅ Make `room` column nullable (allows NULL values)
- ✅ Set default value to 'General' for rows without a room
- ✅ Add `description` column to store the maintenance details

## Step 2: Re-run the Import

```bash
npm run import:inventory
```

Now all three sheets should import successfully:
- 📦 Inventory items
- 🛒 Purchase items
- 🔧 Maintenance tickets (with room values or 'General' as default)

That's it! 🎉
