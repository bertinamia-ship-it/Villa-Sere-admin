# Quick Start Guide - Premium Features

## 1. Apply Database Migration (Required)

The rentals feature requires a new `bookings` table. Apply the migration:

### Option A: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase-rentals-migration.sql`
5. Paste into the editor
6. Click **Run** or press Cmd/Ctrl + Enter
7. Verify "Success. No rows returned" message

### Option B: Using the Script
```bash
# Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY
./apply-rentals-migration.sh
```

## 2. Start the App

```bash
npm run dev
```

Open http://localhost:3000

## 3. Test New Features

### Reports Module
1. Go to **Reports** in the sidebar/nav
2. Select different months to view analytics
3. See expense breakdowns by category and vendor
4. Review maintenance costs by room and month
5. Check inventory insights (low stock items)
6. Click **Export CSV** to download expense report

### Rentals Module
1. Go to **Rentals** in the sidebar/nav
2. Click **Add Booking**
3. Fill in booking details:
   - Guest name (optional)
   - Platform (Airbnb, Booking.com, etc.)
   - Check-in and check-out dates
   - Total amount and cleaning fee
   - Notes
4. View booking in calendar (colored dates indicate bookings)
5. See monthly stats: Income, Expenses, **Profit**, Occupancy %
6. Toggle between Calendar and List view

### CSV Import
1. Go to **Inventory**
2. Click **Import CSV** button
3. Upload a CSV file with headers: `name,category,location,quantity`
4. Optional columns: `min_threshold,notes`
5. Review import results (success count + any errors)

**Sample CSV format:**
```csv
name,category,location,quantity,min_threshold,notes
Towels,Linens,Bathroom 1,8,5,White bath towels
Soap,Toiletries,Storage,12,5,Hand soap bars
Shampoo,Toiletries,Bathroom 1,6,3,Travel size
```

## 4. Excel Inventory Import

You have an Excel file at `data/inventory_villa_serena.xlsx`. To import it:

1. Open the Excel file
2. **File > Save As** 
3. Choose **CSV (Comma delimited) (*.csv)**
4. Save to your Desktop or Downloads
5. In the app, go to Inventory > Import CSV
6. Select the saved CSV file
7. Review results

## 5. Features Overview

### New UI Components
All forms now use standardized components:
- **Input**: Text, number, date fields with labels and validation
- **Select**: Dropdowns with consistent styling
- **Textarea**: Multi-line text inputs
- **Button**: Primary, secondary, danger, ghost variants
- **Card**: Content containers with headers
- **Toast**: Success/error/warning/info notifications

### Toast Notifications
All CRUD operations show feedback:
- ✅ Green for success
- ❌ Red for errors
- ⚠️ Yellow for warnings
- ℹ️ Blue for info

### Loading & Empty States
- Spinners during data fetches
- Helpful empty states with action buttons
- Smooth transitions

## 6. Profit Calculation

The Rentals module calculates monthly profit:

```
Income = Σ(booking.total_amount + booking.cleaning_fee) for month
Expenses = Σ(expense.amount) for month
Profit = Income - Expenses
```

Occupancy rate:
```
Booked Nights = Σ(check_out - check_in) for confirmed bookings
Days in Month = 28-31
Occupancy % = (Booked Nights / Days in Month) × 100
```

## 7. Navigation

### Desktop
- Left sidebar with icons and labels
- Auto-highlights current page
- Sign Out button at bottom

### Mobile
- Top bar with menu toggle
- Bottom navigation with icons
- Tap menu icon to see full nav

## 8. Troubleshooting

### "Cannot find module" TypeScript errors
These are cache issues. Restart the dev server:
```bash
# Stop the server (Ctrl+C)
# Clear Next.js cache
rm -rf .next
# Restart
npm run dev
```

### Migration fails
- Verify you're logged into the correct Supabase project
- Check that the `update_updated_at_column()` function exists (it should from the original schema)
- If it doesn't exist, add this first:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### CSV import errors
- Ensure CSV has required columns: name, category, location, quantity
- Check for extra commas in your data
- Verify file is saved as UTF-8 encoding
- Make sure column names are lowercase

### Reports show no data
- Add some expenses or bookings first
- Select the current month
- Verify your dates are in YYYY-MM-DD format

## 9. Push to GitHub

```bash
git push origin main
```

If you need to set up a remote:
```bash
git remote add origin https://github.com/yourusername/villa-sere-admin.git
git push -u origin main
```

## Support

All code is well-commented and follows Next.js 15 best practices. Check:
- `PREMIUM_UPGRADE.md` - Full feature documentation
- `LOCAL_RUN_CHECKLIST.md` - Setup and testing checklist
- Component files in `/components/ui/` - Usage examples

Enjoy your premium Villa Sere admin app! 🎉
