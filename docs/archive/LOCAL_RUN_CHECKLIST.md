# Local Run Checklist

## Prerequisites (One-Time Setup)

### 1. Configure Supabase (REQUIRED)

**A. Run Database Schema:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `supabase-schema.sql`
3. Paste and execute to create all tables and triggers

**B. Create Storage Bucket:**
1. Go to Storage → Create new bucket
2. Name: `attachments`
3. Set to **Public** (for photo/receipt access)

**C. Configure Auth URLs:**
1. Go to Authentication → URL Configuration
2. Set **Site URL**: `http://localhost:3000`
3. Add **Redirect URLs**: 
   - `http://localhost:3000/**`
   - `http://localhost:3000/auth/callback`

**D. Get API Credentials:**
1. Go to Settings → API
2. Copy **Project URL** and **anon/public key**

### 2. Setup Local Environment

1. **Add Supabase credentials** to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Install dependencies**: `npm install`

3. **Start dev server**: `npm run dev`

4. **Open app**: http://localhost:3000

## First Run Setup

### 3. Create Your Admin Account

1. **Sign up** at http://localhost:3000/login
   - Click "Don't have an account? Sign up"
   - Email: condecorporation@gmail.com (or your email)
   - Password: Choose secure password (min. 6 characters)
   - Full name (optional)

2. **Check email** for confirmation link and click it
   - Should redirect to dashboard after confirmation

3. **Upgrade to admin** (manual step required):
   - Go to Supabase → Table Editor → `profiles`
   - Find your user row
   - Change `role` from `staff` to `admin`
   - Refresh the app

4. **Verify admin access**:
   - You should NOT see the "Staff Account" banner
   - All CRUD operations should work

## QA Checklist ✓

### Input Visibility (FIXED)
- ✅ All input fields show typed text (not invisible)
- ✅ Placeholder text is visible
- ✅ Search boxes work properly
- ✅ All dropdowns show selected values

### Auth Flow
- ✅ Signup with email confirmation
- ✅ Email link redirects to dashboard (no blank page)
- ✅ Login/logout works
- ✅ Profile auto-created via trigger
- ✅ Role banner shows for staff accounts

### Inventory Module
- ✅ Add new item with photo upload
- ✅ Edit existing item
- ✅ Delete item
- ✅ Quick adjust quantity (+/-)
- ✅ Search and filter by category/room
- ✅ CSV export

### Vendors Module
- ✅ Add vendor with contact info
- ✅ Edit vendor
- ✅ Delete vendor
- ✅ Search vendors
- ✅ WhatsApp link works

### Maintenance Tickets
- ✅ Create ticket with photo
- ✅ Edit ticket status/priority
- ✅ Link to vendor
- ✅ Add cost
- ✅ Filter by status/priority/room
- ✅ Search tickets

### Expenses Module
- ✅ Add expense with receipt upload
- ✅ Link to vendor/ticket
- ✅ Monthly summaries
- ✅ CSV export
- ✅ Filter by month

## Troubleshooting

**Input text invisible?**
- All fixed! Text color classes added to all inputs (`text-gray-900`, `placeholder-gray-400`)

**Port 3000 in use?**
```bash
lsof -ti:3000 | xargs kill -9
```

**Module errors after npm install?**
```bash
rm -rf node_modules .next
npm install
```

**Supabase errors?**
- Verify `.env.local` has correct credentials
- Check storage bucket `attachments` exists and is public
- Verify redirect URLs are configured

**Email confirmation not working?**
- Check Supabase Auth redirect URLs
- Should include `http://localhost:3000/auth/callback`

**Can't upload photos/receipts?**
- Verify storage bucket `attachments` is created
- Must be set to **Public** access
- Check Supabase storage quota
