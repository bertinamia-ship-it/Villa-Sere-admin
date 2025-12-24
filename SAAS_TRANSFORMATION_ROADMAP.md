# 🚀 SaaS Multi-Tenant Transformation Roadmap

## ✅ Backup Status
- **Backup Branch:** `backup-working-v1` 
- **Location:** Local + GitHub remote
- **Commit:** `6b0eeea` (Dec 24, 2025)
- **Status:** ✅ Fully backed up and safe
- **Rollback:** `git checkout backup-working-v1` (instant rollback to stable state)

Current working version includes:
- ✅ Auth system (Supabase)
- ✅ Bookings/Rentals module (calendar, tooltips, gradients)
- ✅ Inventory tracking
- ✅ Expense management
- ✅ Premium UI (buttons, input fixes, landing page)
- ✅ To-buy list
- ✅ Input visibility fix (webkit autofill)

---

## 📋 HIGH-LEVEL SCOPE & APPROACH

### Phase 1: Data Architecture (Multi-Tenant Foundation)
**Goal:** Isolate data per user/property without breaking existing features

#### Current State
- Single monolithic property (Villa Serena)
- All bookings/inventory/expenses share one "created_by" field
- No property ownership concept in the database

#### Proposed Changes
1. **Add `properties` table**
   - `id` (UUID, primary key)
   - `owner_id` (UUID, FK to auth.users)
   - `name` (text, e.g., "Villa Serena", "Beachfront Apt")
   - `location` (text)
   - `created_at`, `updated_at`
   - RLS: Users can only access their own properties

2. **Update existing tables** (bookings, inventory, expenses, maintenance_tickets, purchase_items)
   - Add `property_id` (UUID, FK to properties)
   - Remove/adjust `created_by` reliance
   - Update RLS policies: Check `property_id` + user ownership
   - No existing data loss (migration script to assign all current records to user's property)

3. **Database Migration Path**
   - Create new schema incrementally
   - Add fields without breaking existing queries
   - Backfill data with script
   - Test on staging before production push

#### Risk Mitigation
- ✅ Backup branch created (can revert instantly)
- ✅ Test migrations locally first
- ✅ Keep existing code working during transition
- ✅ Add feature flags if needed for gradual rollout

---

### Phase 2: User & Property Management UI
**Goal:** Let users manage their properties and invite team members

#### New Pages/Features
1. **Settings / Properties Dashboard**
   - List user's properties
   - Add/edit property details
   - Delete property (with confirmation)
   - Set primary property (for default view)

2. **Property Selector** (in main dashboard layout)
   - Dropdown to switch between user's properties
   - Remembers selection in session
   - Updates all data views (bookings, inventory, etc.)

3. **Team Management** (Future Phase, not in this roadmap)
   - Invite team members to a property
   - Manage roles (admin, staff)
   - Set permissions per team member

#### Implementation
- Minimal UI changes to existing pages
- Add context/hook for current selected property
- Update queries to filter by property_id
- Test backward compatibility

---

### Phase 3: Professional UI/UX Polish
**Goal:** Make it feel like a premium product, not a prototype

#### Calendar Enhancements (Already Started)
- ✅ Gradient fills on booked ranges
- ✅ Tooltips on hover (guest, amount, status)
- ✅ Today highlight
- ✅ Legend
- [ ] Color-code by booking status (confirmed/pending/cancelled)
- [ ] Add month/year selector with navigation

#### Dashboard Home Improvements
- Hero section with property photo carousel
- Quick status cards:
  - "Next booking" (guest name, dates, amount)
  - "Current occupancy" (% filled this month)
  - "Revenue this month" (YTD if applicable)
  - "Upcoming maintenance" (next 7 days)
- Visual property selector (cards, not just dropdown)

#### Form & Input Polish
- ✅ Dark text on light backgrounds (autofill fix)
- ✅ Improved button styling (gradients, shadows)
- [ ] Add form validation feedback (inline errors)
- [ ] Improve spacing and typography
- [ ] Add micro-interactions (loading spinners, success toasts)

#### Color & Design System
- Primary: Indigo (current: #4F46E5)
- Success: Emerald
- Warning: Amber
- Danger: Red
- Neutral: Slate
- Consistent shadows, spacing, border radius

---

### Phase 4: Incremental Rollout Plan
**Timeline: Conservative, breaking-change-free**

#### Week 1-2: Database & API Layer
1. Add `properties` table to Supabase
2. Migrate existing data
3. Update RLS policies
4. Test all queries with new schema
5. Deploy to production (no UI changes yet)

#### Week 3-4: Backend Logic & Property Switching
1. Update API queries to filter by property_id
2. Add property selector to layout
3. Add property context to all pages
4. Test bookings, inventory, expenses with multiple properties
5. Deploy (UI looks mostly same, but now multi-tenant)

#### Week 5-6: UI Polish & Design
1. Improve calendar styling (colors, status indicators)
2. Enhance dashboard home (cards, stats)
3. Add property management pages
4. Polish forms and inputs
5. Deploy premium look

---

## 🏗️ Technical Architecture (High-Level)

### Database Structure (Proposed)
```
profiles (existing, extended)
  ├── id (PK, FK to auth.users)
  ├── email
  ├── full_name
  ├── role ('admin', 'staff')
  ├── preferred_property_id (FK to properties)
  └── created_at

properties (new)
  ├── id (UUID, PK)
  ├── owner_id (FK to auth.users)
  ├── name
  ├── location
  ├── photo_url (for hero)
  ├── description
  └── created_at

bookings (extend)
  ├── id
  ├── property_id (new FK to properties)
  ├── guest_name
  ├── check_in
  ├── check_out
  ├── total_amount
  └── ... (rest unchanged)

inventory_items (extend)
  ├── id
  ├── property_id (new FK to properties)
  ├── name
  ├── quantity
  └── ... (rest unchanged)

expenses (extend)
  ├── id
  ├── property_id (new FK to properties)
  ├── amount
  ├── category
  └── ... (rest unchanged)

maintenance_tickets (extend)
  ├── id
  ├── property_id (new FK to properties)
  ├── title
  ├── status
  └── ... (rest unchanged)

purchase_items (extend)
  ├── id
  ├── property_id (new FK to properties)
  ├── item_name
  ├── status
  └── ... (rest unchanged)
```

### Application Layer Changes
- **Context Provider:** Current property selection (localStorage + context)
- **Custom Hooks:** `useCurrentProperty()`, `useUserProperties()`
- **Query Builders:** Add property filter to all Supabase queries
- **Page Components:** Accept and use property_id from context

### No Breaking Changes
- Existing bookings continue to work
- Existing users see all their data immediately
- Can still offer single-property view (default)
- Multi-property is opt-in (backward compatible)

---

## ⚠️ Risk Mitigation Strategy

### If Something Breaks
1. **Immediate Rollback:** `git checkout backup-working-v1`
2. **Identify Issue:** Check which component failed
3. **Fix Incrementally:** Update the specific part, test locally
4. **Re-deploy:** Push to main, redeploy to Vercel
5. **Don't Panic:** Backup is always available

### Testing Approach
1. **Local first:** Run `npm run dev`, test all pages manually
2. **Multiple properties:** Create test properties, verify data isolation
3. **RLS edge cases:** Try to access another user's data (should fail)
4. **Existing features:** Ensure bookings, inventory, expenses still work exactly as before

### Deployment Strategy
- **Database migrations first:** Deploy new schema to Supabase (non-breaking)
- **Code changes second:** Update queries to use property_id (still works with existing data)
- **UI last:** Add new pages/features once data layer is solid
- **Feature flags:** If needed, can hide multi-property UI until ready

---

## 📊 Success Criteria

- ✅ All existing features work exactly as before
- ✅ Users can manage multiple properties
- ✅ Data is completely isolated per user + property
- ✅ Calendar is visually impressive
- ✅ Dashboard feels like a real product
- ✅ Zero data loss or corruption
- ✅ Backup can restore in <5 minutes if needed

---

## 🎯 Next Steps

**Confirm:**
1. ✅ Backup branch created (`backup-working-v1`)
2. ✅ Backup pushed to GitHub
3. **Do you approve the technical approach above?**
4. **Any specific design preferences for the SaaS look?**
5. **Ready to start Phase 1 (Database Architecture)?**

Once confirmed, I'll:
1. Design the migration script
2. Create new database schema
3. Test locally with multiple users/properties
4. Deploy to staging/production incrementally

---

## 📝 Status Tracker
- [x] Backup created
- [x] Backup pushed to GitHub  
- [ ] Technical approach approved
- [ ] Phase 1 schema designed
- [ ] Phase 1 deployed
- [ ] Phase 2 UI implemented
- [ ] Phase 3 design polish
- [ ] Phase 4 testing complete
- [ ] Launch as SaaS product

---

**Reminder:** At ANY point, if you want to revert to the stable backup:
```bash
git checkout backup-working-v1
git push -f origin main  # (if needed)
```

This entire project can be restored to this moment in seconds.
