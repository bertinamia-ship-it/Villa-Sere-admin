# 🧪 Manual Testing Guide - Villa Sere

## Prerequisites
1. Database schema deployed ✅ (verified - tables exist)
2. Storage bucket created ⏳ (needs manual creation)
3. Dev server running ✅ (http://localhost:3000)

## Step-by-Step Manual Tests

### 1. AUTH & SESSION (5 min)

**Signup:**
1. Open: http://localhost:3000/signup
2. Enter:
   - Email: admin@villasere.com
   - Password: VillaSere2025!
   - Full Name: Villa Admin
3. Click "Sign Up"
4. ✅ Should redirect to dashboard

**Login:**
1. Open: http://localhost:3000/login
2. Enter same credentials
3. ✅ Should login successfully

**Session Persistence:**
1. Refresh page (F5)
2. ✅ Should stay logged in
3. Navigate between pages
4. ✅ Session should persist

**Logout:**
1. Click logout button
2. ✅ Should redirect to login page

**Upgrade to Admin:**
1. Open: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/editor
2. Run SQL:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@villasere.com';
   ```

---

### 2. STORAGE BUCKET (2 min)

**Create Bucket:**
1. Open: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh/storage/buckets
2. Click "New bucket"
3. Name: **attachments**
4. Public: **OFF**
5. Click "Create bucket"

**Add Policy:**
1. Click "attachments" bucket
2. Go to "Policies" tab
3. Click "New Policy"
4. Choose: "Give users authenticated access to a folder"
5. Policy name: authenticated-all
6. Target roles: authenticated
7. Allowed operations: SELECT, INSERT, UPDATE, DELETE
8. Click "Review" → "Save policy"

---

### 3. VENDORS (3 min)

1. Go to: Dashboard → Vendors
2. Click "Add Vendor"
3. Fill in:
   - Company: Test Plumbing Co
   - Specialty: Plumbing & Electrical
   - Phone: +52-624-123-4567
   - WhatsApp: +526241234567
   - Email: contact@testplumbing.com
   - Notes: Test vendor for E2E
4. Click "Save"
5. ✅ Vendor appears in list

**Edit:**
1. Click pencil icon on vendor
2. Change specialty to "Plumbing Only"
3. Click "Save"
4. ✅ Changes persist

**WhatsApp Link:**
1. Click WhatsApp icon
2. ✅ Should open WhatsApp (or show install prompt)

---

### 4. INVENTORY (5 min)

1. Go to: Dashboard → Inventory
2. Click "Add Item"
3. Fill in:
   - Name: Chlorine Tablets
   - Category: Pool & Outdoor
   - Location: Storage
   - Quantity: 20
   - Min Threshold: 5
   - Notes: For pool maintenance
4. **Upload Photo** (test image upload):
   - Click photo upload
   - Select any image
   - ✅ Image should upload and display
5. Click "Save"
6. ✅ Item appears in list with photo

**Quick Adjust:**
1. Click + button twice
2. ✅ Quantity should increase to 22
3. Click - button once
4. ✅ Quantity should decrease to 21

**Low Stock Alert:**
1. Click pencil to edit
2. Set Quantity to 3 (below min threshold of 5)
3. ✅ Should show red "Low stock!" alert

**CSV Export:**
1. Click "Export CSV" button
2. ✅ Should download CSV file
3. Open file
4. ✅ Should contain inventory data

**Delete:**
1. Click trash icon on item
2. Confirm deletion
3. ✅ Item removed from list

---

### 5. MAINTENANCE (5 min)

1. Go to: Dashboard → Maintenance
2. Click "New Ticket"
3. Fill in:
   - Title: Pool Filter Repair
   - Room: Pool Area
   - Priority: High
   - Status: Open
   - Vendor: Select "Test Plumbing Co"
   - Cost: 150.00
   - Notes: Filter making strange noise
4. **Upload Photo**:
   - Click photo upload
   - Select image
   - ✅ Should upload successfully
5. Click "Save"
6. ✅ Ticket appears in list

**Status Updates:**
1. Click on ticket to edit
2. Change status to "In Progress"
3. ✅ Status badge should update
4. Change to "Done"
5. ✅ Ticket should show as completed

**Filtering:**
1. Use priority filter dropdown
2. ✅ Tickets should filter correctly
3. Use status filter
4. ✅ Should show only matching tickets

---

### 6. EXPENSES (5 min)

1. Go to: Dashboard → Expenses
2. Click "Add Expense"
3. Fill in:
   - Date: Today
   - Amount: 150.00
   - Category: Maintenance
   - Vendor: Test Plumbing Co
   - Ticket: Pool Filter Repair
   - Notes: Payment for pool repair
4. **Upload Receipt**:
   - Click receipt upload
   - Select image/PDF
   - ✅ Should upload successfully
5. Click "Save"
6. ✅ Expense appears in list

**Monthly Summary:**
1. Check monthly summary section
2. ✅ Should show total: $150.00
3. ✅ Should show breakdown by category
4. ✅ Should show vendor spending

**Links Verification:**
1. Expense should show linked vendor name
2. ✅ Click vendor link (if available)
3. Expense should show linked ticket
4. ✅ Should display correctly

**CSV Export:**
1. Click "Export CSV" button
2. ✅ Should download expenses CSV
3. Open file
4. ✅ Should contain expense data

**Month Navigation:**
1. Change month selector
2. ✅ Expenses should filter by month
3. ✅ Totals should recalculate

---

### 7. DASHBOARD HOME (2 min)

1. Go to: Dashboard → Home
2. ✅ Should show stats:
   - Total inventory items
   - Total vendors
   - Open tickets count
   - Current month expenses
3. ✅ Should show recent activity
4. ✅ Quick links should work

---

### 8. UI/UX CHECKS (5 min)

**Desktop (Browser):**
1. Test all navigation links
2. ✅ Sidebar should work correctly
3. ✅ Forms should be readable
4. ✅ Tables should be responsive

**Mobile (Browser Dev Tools):**
1. Open Dev Tools (F12)
2. Toggle device toolbar
3. Select iPhone or Android
4. Test navigation
5. ✅ Hamburger menu should work
6. ✅ Forms should be usable
7. ✅ Touch targets should be large enough

**Console Errors:**
1. Open Console (F12)
2. Navigate through all pages
3. ✅ No red errors (warnings OK)
4. ✅ No hydration errors

---

### 9. PWA INSTALLATION (3 min)

**Desktop:**
1. Look for install icon in address bar (Chrome/Edge)
2. Click to install
3. ✅ App should install
4. Open installed app
5. ✅ Should open like native app

**Mobile (Actual Device):**
1. Open http://localhost:3000 (or deployed URL)
2. **iOS:** Safari → Share → Add to Home Screen
3. **Android:** Chrome → Menu → Install app
4. ✅ Icon should appear on home screen
5. Tap icon
6. ✅ Should open full-screen

**Offline Test:**
1. Install PWA
2. Turn on Airplane mode (or disable network)
3. Open app
4. ✅ Should load cached pages
5. ✅ Should show offline indicator (if implemented)

---

### 10. BUILD & DEPLOY (5 min)

**Local Build:**
```bash
cd /workspaces/villa-sere-admin
npm run build
```
✅ Should complete without errors

**Deploy to Vercel:**
```bash
npx vercel
```

Follow prompts:
1. Link to project or create new
2. Accept defaults
3. Wait for deployment
4. ✅ Get deployment URL

**Add Environment Variables:**
1. Go to Vercel dashboard
2. Project → Settings → Environment Variables
3. Add:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Redeploy

**Test Live:**
1. Open deployment URL
2. Repeat auth tests
3. ✅ Everything should work

---

## ✅ Completion Checklist

- [ ] User signup works
- [ ] User login works
- [ ] Session persists
- [ ] Logout works
- [ ] User upgraded to admin
- [ ] Storage bucket created
- [ ] Storage policies configured
- [ ] Vendors: Create/Edit/Delete
- [ ] Inventory: Create/Edit/Delete/Photo
- [ ] Inventory: Quick adjust works
- [ ] Inventory: CSV export works
- [ ] Maintenance: Create/Edit/Delete/Photo
- [ ] Maintenance: Status changes work
- [ ] Maintenance: Vendor linking works
- [ ] Expenses: Create/Edit/Delete/Receipt
- [ ] Expenses: Vendor/ticket linking works
- [ ] Expenses: Monthly totals correct
- [ ] Expenses: CSV export works
- [ ] Dashboard shows correct stats
- [ ] Navigation works everywhere
- [ ] No console errors
- [ ] Mobile responsive
- [ ] PWA installable
- [ ] Build succeeds
- [ ] Deployed to Vercel
- [ ] Live app works

---

## 🎉 When All Tests Pass

Your Villa Sere management app is fully functional and ready for daily use!

**Next Steps:**
1. Create your real admin account
2. Add actual vendors
3. Start tracking inventory
4. Log maintenance tickets
5. Record expenses

**Support:**
- Documentation: See README.md, FINAL_CHECKLIST.md
- Database: https://supabase.com/dashboard/project/euxgrvunyghbpenkcgwh
- Deployments: https://vercel.com/dashboard
