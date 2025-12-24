# 🚀 QUICK FIX: Deploy Bookings Table & Environment Variables

## Issue Found
✅ **Root Cause Identified**: The `bookings` table was missing from the Supabase database!

The rentals module UI code is complete and correct, but the database table didn't exist. That's why creating bookings did nothing.

---

## ✅ STEP 1: Create the Bookings Table (5 minutes)

### Option A: Using Supabase Dashboard (Recommended - Fastest)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Villa Serena project

2. **Create the table using SQL Editor**
   - Click: **SQL Editor** (left sidebar)
   - Click: **New Query**
   - Copy & paste the SQL below:

```sql
-- Create bookings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guest_name TEXT,
  platform TEXT DEFAULT 'Airbnb',
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nightly_rate DECIMAL(10, 2),
  total_amount DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone authenticated can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON public.bookings;

CREATE POLICY "Anyone authenticated can view bookings" ON public.bookings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update bookings" ON public.bookings
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete bookings" ON public.bookings
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.bookings;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

3. **Click the blue "Run" button**
   - Wait for success confirmation ✅

### Option B: Using Command Line (psql)

```bash
# If you have psql installed
psql postgresql://postgres:[PASSWORD]@[YOUR_HOST].supabase.co:5432/postgres -f create-bookings-table.sql
```

---

## ✅ STEP 2: Configure Vercel Environment Variables

### Set Up Environment Variables in Vercel

1. **Open Vercel Dashboard**
   - Go to: https://vercel.com/dashboard/projects
   - Select your **Villa Sere** project

2. **Go to Settings > Environment Variables**
   - Click: **Settings** (top menu)
   - Click: **Environment Variables** (left sidebar)

3. **Add Variables to ALL Three Environments** (Production, Preview, Development)

   For each environment, add these two variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL (from `.env.local`) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key (from `.env.local`) |

   **⚠️ IMPORTANT: DO NOT add `SUPABASE_SERVICE_ROLE_KEY`** (too sensitive for Vercel)

   ### Steps for each variable:
   - Click: **Add New**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://[YOUR_PROJECT].supabase.co`
   - Under "Environments", select all three: ✅ Production ✅ Preview ✅ Development
   - Click: **Save**

   Then repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Copy your values from `.env.local`**:
   ```bash
   cat .env.local | grep NEXT_PUBLIC_SUPABASE
   ```

---

## ✅ STEP 3: Force Dynamic Pages (Fix Prerender Issues)

To prevent Vercel from trying to prerender protected pages (which will fail without auth context):

1. **Open**: `app/(dashboard)/rentals/page.tsx`
2. **Add at the top**, right after `'use client'`:
   ```typescript
   export const dynamic = 'force-dynamic'
   ```

3. **Open**: `app/(dashboard)/expenses/page.tsx`
4. **Add the same line**:
   ```typescript
   export const dynamic = 'force-dynamic'
   ```

---

## ✅ STEP 4: Deploy to Vercel

```bash
# Commit your changes
git add .
git commit -m "fix: Add bookings table and Vercel env vars"

# Push to GitHub (which triggers Vercel deploy)
git push
```

Then monitor your deployment at: https://vercel.com/dashboard/projects

---

## ✅ STEP 5: Test Everything Works

### Test 1: Create a Rental (Hospedaje)
1. Go to your app: `https://yourapp.vercel.app/dashboard/rentals`
2. Click: **Add Booking**
3. Fill in the form:
   - Guest Name: "Test Guest"
   - Platform: "Airbnb"
   - Check-in: (pick a date)
   - Check-out: (pick a date after check-in)
   - Total Amount: 100
   - Cleaning Fee: 50
4. Click: **Save Booking**
5. ✅ Should appear immediately in the calendar and list!

### Test 2: Check Console Logs (Debug)
If it doesn't work, check browser console:
1. Press: `F12` (or Cmd+Option+I on Mac)
2. Go to: **Console** tab
3. Look for `📝 Saving booking:` and `✅ Booking created:` messages
4. These will help identify the issue

---

## 📋 Checklist

- [ ] Created bookings table in Supabase
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL` to Vercel (all 3 environments)
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel (all 3 environments)
- [ ] Added `export const dynamic = 'force-dynamic'` to rentals page
- [ ] Added `export const dynamic = 'force-dynamic'` to expenses page
- [ ] Pushed changes to GitHub
- [ ] Verified Vercel deployment completed
- [ ] Tested rental creation works

---

## 🆘 Troubleshooting

### Booking still not saving?
- Check browser console (F12) for error messages
- Verify you're logged in
- Check Supabase project is correct

### Vercel build failing?
- Check build logs: https://vercel.com/dashboard/projects
- Ensure env vars are set correctly
- Run `npm run build` locally to test

### Still stuck?
- Message me with the error from the browser console
- I added debug logging that will help identify the issue

---

**You're all set! The rentals feature should now be fully functional! 🎉**
