# 🚀 Quick Start: Import Your Excel Data

## Step 1: Get Supabase Service Role Key

1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/settings/api
2. Find **"service_role"** key under **Project API keys**
3. Copy the secret key (starts with `eyJhbG...`)
4. Add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-key-here
   ```

## Step 2: Apply Database Migration

1. Go to: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/sql/new
2. Open file: `supabase-purchase-items-migration.sql`
3. Copy entire contents and paste in SQL Editor
4. Click **Run** button
5. Verify: Go to Table Editor → should see `purchase_items` table

## Step 3: Run the Import

```bash
npm run import:inventory
```

That's it! The script will:
- ✅ Import all inventory items (Sheet 1)
- ✅ Import your to-buy list (Sheet 2)
- ✅ Import maintenance tickets (Sheet 3)
- ✅ Show detailed summary with counts

## View Your Data

Start the app and check:
```bash
npm run dev
```

- **Inventory:** http://localhost:3000/dashboard/inventory
- **To Buy:** http://localhost:3000/dashboard/to-buy
- **Maintenance:** http://localhost:3000/dashboard/maintenance

---

📖 For detailed docs, see: `IMPORT_INSTRUCTIONS.md`
