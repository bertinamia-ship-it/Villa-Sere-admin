# 🏢 Multi-Tenant Migration Guide

## 📋 Overview

This guide documents the transformation from single-tenant to multi-tenant SaaS architecture.

**Goal:** Each user/organization gets isolated data via `tenant_id`. Zero demo data on signup.

---

## 🎯 Requirements

### ✅ What We Need:

1. **Schema Multi-Tenant:**
   - `tenants` table (organizations)
   - `tenant_id` in all data tables
   - RLS policies for isolation

2. **Zero Demo Data:**
   - No seeds on signup
   - No auto-created tasks/items
   - Empty state for new tenants

3. **Signup Flow:**
   - Create tenant/organization
   - Create profile with tenant_id
   - No data initialization

4. **Data Isolation:**
   - All queries filter by tenant_id
   - RLS enforces isolation
   - "Villa Serena" = one tenant, not hardcoded

---

## 📊 Database Changes

### New Table: `tenants`

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  subscription_status TEXT DEFAULT 'trial',
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Updated Tables (add `tenant_id`):

- ✅ `profiles`
- ✅ `vendors`
- ✅ `inventory_items`
- ✅ `maintenance_tickets`
- ✅ `expenses`
- ✅ `bookings`
- ✅ `purchase_items`

---

## 🔒 RLS Policy Pattern

All policies follow this pattern:

```sql
CREATE POLICY "Users can [action] [table] in their tenant"
  ON public.[table] FOR [SELECT|INSERT|UPDATE|DELETE]
  USING (tenant_id IN (
    SELECT id FROM public.tenants WHERE owner_id = auth.uid()
  ));
```

This ensures users can only access data from their own tenant.

---

## 🚀 Migration Steps

### Step 1: Run SQL Migration

```bash
# In Supabase SQL Editor, run:
supabase-multi-tenant-migration.sql
```

This will:
- Create `tenants` table
- Add `tenant_id` columns to all tables
- Update RLS policies
- Update `handle_new_user()` function

### Step 2: Update Application Code

1. **Use tenant helper:**
   ```typescript
   import { getCurrentTenantId } from '@/lib/utils/tenant'
   
   const tenantId = await getCurrentTenantId()
   const { data } = await supabase
     .from('inventory_items')
     .select('*')
     .eq('tenant_id', tenantId)
   ```

2. **Update all queries** to include tenant_id filter

3. **Remove hardcoded "Villa Serena"** references

### Step 3: Remove Demo Data

- ✅ Delete `scripts/seed-data.ts` (or keep for testing only)
- ✅ Remove any auto-create logic in signup
- ✅ Ensure empty state on new tenant creation

### Step 4: Test Isolation

1. Create two test accounts
2. Verify data is isolated
3. Test RLS policies
4. Verify no cross-tenant data access

---

## 📝 Signup Flow (New)

### Before (Single-Tenant):
```
User signs up → Profile created → Access all data
```

### After (Multi-Tenant):
```
User signs up → Tenant created → Profile created with tenant_id → Empty state
```

**No demo data, no seeds, no auto-created items.**

---

## 🔧 Code Changes Required

### 1. Update Queries

**Before:**
```typescript
const { data } = await supabase
  .from('inventory_items')
  .select('*')
```

**After:**
```typescript
const tenantId = await getCurrentTenantId()
const { data } = await supabase
  .from('inventory_items')
  .select('*')
  .eq('tenant_id', tenantId)
```

### 2. Update Inserts

**Before:**
```typescript
await supabase
  .from('inventory_items')
  .insert({ name, quantity, ... })
```

**After:**
```typescript
const tenantId = await getCurrentTenantId()
await supabase
  .from('inventory_items')
  .insert({ 
    name, 
    quantity, 
    tenant_id: tenantId,
    ... 
  })
```

### 3. Remove Hardcoding

**Before:**
```typescript
<h1>Villa Sere Management</h1>
```

**After:**
```typescript
const tenant = await getCurrentTenant()
<h1>{tenant?.name || 'Villa Management'}</h1>
```

---

## ✅ Checklist

### Database:
- [x] Create `tenants` table
- [x] Add `tenant_id` to all tables
- [x] Update RLS policies
- [x] Update `handle_new_user()` function
- [x] Create indexes

### Application:
- [ ] Update all queries to use tenant_id
- [ ] Update all inserts to include tenant_id
- [ ] Remove hardcoded "Villa Serena" references
- [ ] Update UI to show tenant name
- [ ] Remove seed/demo data scripts

### Testing:
- [ ] Test signup creates tenant
- [ ] Test data isolation
- [ ] Test RLS policies
- [ ] Test empty state

---

## 🎯 Result

After migration:
- ✅ Each user gets their own tenant
- ✅ Complete data isolation
- ✅ Zero demo data on signup
- ✅ "Villa Serena" is just one tenant
- ✅ Ready for SaaS billing integration

---

**Status:** Migration SQL ready, application code updates pending


