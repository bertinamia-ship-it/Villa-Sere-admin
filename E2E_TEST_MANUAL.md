# 🧪 Complete E2E Test Manual

**Date:** December 23, 2025  
**App:** Villa Sere Admin  
**Status:** Ready for Testing

## ✅ Pre-Test Verification

- [x] Dev server running: http://localhost:3000
- [x] All 31 infrastructure checks passed
- [x] TypeScript build: Compiled successfully
- [x] Service role key configured
- [x] Excel file present (21MB)

---

## 📋 Test Flows

### 1️⃣ INVENTORY MODULE

#### View List
- [ ] Navigate to: http://localhost:3000/dashboard/inventory
- [ ] Confirm dinnerware items are displayed from Excel import
- [ ] Verify each item shows: Name, Category, Location, Quantity

#### Search & Filter
- [ ] Search box works - type "plate" and see filtered results
- [ ] Category filter dropdown works - select "Dinnerware"
- [ ] Room filter dropdown works - select a specific room
- [ ] Clear filters - should show all items again

#### Add New Item
- [ ] Click "+ Add Item" button
- [ ] Fill in form:
  - Name: "Test Bowl"
  - Category: "Dinnerware"
  - Location: "Kitchen"
  - Quantity: 5
- [ ] Submit form
- [ ] Confirm item appears in list

#### Edit Item
- [ ] Click pencil icon on any item
- [ ] Edit quantity to 10
- [ ] Submit form
- [ ] Confirm quantity updated in list

#### Upload Photo
- [ ] Click pencil icon on an item
- [ ] Upload a test image file
- [ ] Confirm image displays
- [ ] Save and verify photo is retained

---

### 2️⃣ TO BUY / PURCHASE ITEMS MODULE

#### View List
- [ ] Navigate to: http://localhost:3000/dashboard/to-buy
- [ ] Confirm purchased items are displayed from Excel import
- [ ] Verify items grouped by area (Master, Kitchen, etc.)
- [ ] See status summary cards showing counts (To Buy, Ordered, Received)

#### Change Status
- [ ] Click on any "To Buy" item status badge
- [ ] Change status: To Buy → Ordered
- [ ] Confirm item moves to Ordered column/view
- [ ] Change status: Ordered → Received
- [ ] Confirm item moves to Received

#### Edit Item
- [ ] Click pencil icon on an item
- [ ] Edit quantity to 3
- [ ] Edit notes: "Priority item"
- [ ] Submit form
- [ ] Confirm changes appear in list

#### Filter by Status
- [ ] Click "Status" dropdown
- [ ] Select "Ordered"
- [ ] Confirm only ordered items are shown
- [ ] Select "Received"
- [ ] Confirm only received items are shown

#### Filter by Area
- [ ] Click "Area" dropdown
- [ ] Select "MASTER"
- [ ] Confirm only MASTER area items shown
- [ ] Clear filters to reset

---

### 3️⃣ MAINTENANCE MODULE

#### View Tickets
- [ ] Navigate to: http://localhost:3000/dashboard/maintenance
- [ ] Confirm maintenance tickets are displayed from Excel import
- [ ] Verify each ticket shows: Title, Room, Status, Priority

#### Filter by Room
- [ ] Click room filter dropdown
- [ ] Select "MASTER BEDROOM"
- [ ] Confirm tickets filtered to that room
- [ ] Clear and select another room

#### Filter by Status
- [ ] Click status filter dropdown
- [ ] Select "open"
- [ ] Confirm only open tickets shown
- [ ] Try "in_progress" and "done" statuses

#### Create New Ticket
- [ ] Click "+ New Ticket" button
- [ ] Fill in form:
  - Title: "Fix bathroom light"
  - Room: "Guest Bath"
  - Status: "open"
  - Priority: "high"
- [ ] Submit form
- [ ] Confirm ticket appears in list

#### Attach Photo
- [ ] Click on any ticket to open details
- [ ] Upload a test image/photo of the issue
- [ ] Confirm photo is stored and displays

---

### 4️⃣ EXPENSES MODULE

#### View Expenses
- [ ] Navigate to: http://localhost:3000/dashboard/expenses
- [ ] Confirm existing expenses are displayed

#### Add Expense
- [ ] Click "+ Add Expense" button
- [ ] Fill in form:
  - Date: Today's date
  - Amount: 125.50
  - Category: "Maintenance"
  - Vendor: (select from dropdown or create)
  - Notes: "Plumbing repair"
- [ ] Submit form
- [ ] Confirm expense appears in list

#### Assign Category
- [ ] Verify expense has category: "Maintenance"
- [ ] Edit expense and change category
- [ ] Confirm category updates

#### Assign Vendor
- [ ] Click dropdown and select/create vendor
- [ ] Confirm vendor is linked to expense

#### Upload Receipt
- [ ] Click on expense
- [ ] Upload receipt image/PDF
- [ ] Confirm receipt is stored

---

### 5️⃣ REPORTS MODULE

#### Monthly Expenses Summary
- [ ] Navigate to: http://localhost:3000/dashboard/reports
- [ ] Confirm chart showing monthly expense trends
- [ ] See breakdown by category (pie/bar chart)
- [ ] Verify totals are calculated correctly

#### Maintenance Cost Totals
- [ ] Scroll to maintenance section
- [ ] Confirm total costs by month displayed
- [ ] See breakdown by room
- [ ] Verify calculations are accurate

#### Inventory Insights
- [ ] Scroll to inventory section
- [ ] Confirm low stock items highlighted
- [ ] See inventory count by category
- [ ] Verify items grouped by location/room

#### CSV Export
- [ ] Click "Export" button (if available)
- [ ] Confirm CSV file downloads with data

---

### 6️⃣ UI/UX VERIFICATION

#### Text Visibility
- [ ] [ ] All input fields show typed text (not invisible)
- [ ] [ ] Placeholder text is visible
- [ ] [ ] Labels are readable
- [ ] [ ] Button text is visible

#### Spacing & Alignment
- [ ] Form fields are properly aligned
- [ ] Cards have consistent spacing
- [ ] Mobile viewport works (if testing on mobile)
- [ ] No overlapping elements

#### Navigation
- [ ] Sidebar navigation works
- [ ] Active page is highlighted
- [ ] All menu items accessible
- [ ] Breadcrumbs display correctly (if implemented)

#### Error Handling
- [ ] Try submitting empty form - should show validation
- [ ] Try invalid input - should show error message
- [ ] Delete item - should ask for confirmation
- [ ] Cancel actions - should work properly

#### Console Errors
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Should see no red errors
- [ ] Warnings are acceptable (middleware deprecation)

---

### 7️⃣ AUTHENTICATION & PERMISSIONS

#### Login
- [ ] Visit http://localhost:3000/login
- [ ] Log in with existing test account
- [ ] Confirm redirected to dashboard
- [ ] Confirm user menu shows email

#### Profile Access
- [ ] Confirm user can view profile
- [ ] Verify user role displays correctly

#### Logout
- [ ] Click logout
- [ ] Confirm redirected to login page

---

## 📊 Test Results Summary

| Module | Status | Notes |
|--------|--------|-------|
| Inventory | ⭕ | Pending manual verification |
| To Buy | ⭕ | Pending manual verification |
| Maintenance | ⭕ | Pending manual verification |
| Expenses | ⭕ | Pending manual verification |
| Reports | ⭕ | Pending manual verification |
| UI/UX | ⭕ | Pending manual verification |
| Auth | ⭕ | Pending manual verification |

---

## ✅ Completion Checklist

Once all manual tests pass, confirm:

- [ ] All modules functional and data flowing correctly
- [ ] No TypeScript/build errors
- [ ] No console errors in DevTools
- [ ] Text visible in all inputs/forms
- [ ] Proper spacing and alignment throughout
- [ ] All CRUD operations working
- [ ] Filtering and search working
- [ ] Status workflows functional (To Buy → Ordered → Received)
- [ ] File uploads working (photos, receipts)
- [ ] Reports calculating correctly

---

## 🎯 Final Status

Once all items above are checked:

**✅ App is STABLE and READY for next improvements**

---

## 📝 Notes

- Test user credentials: (use your existing test account)
- All data is isolated per user (Supabase RLS)
- Excel import is idempotent - can re-run safely
- Photos stored in Supabase Storage bucket "attachments"
