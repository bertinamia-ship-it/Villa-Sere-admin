# 🔍 Migration Audit - Multi-Tenant Update

## 📊 Resumen

**Total archivos a modificar:** 25+ archivos  
**Queries sin tenant_id:** 39+ queries  
**Referencias hardcodeadas:** 8 archivos principales

---

## 🎯 A) Lib/DB Helpers (Query Wrapper)

### Archivos a crear/modificar:

1. **`lib/utils/tenant.ts`** ✅ (Ya creado)
   - `getCurrentTenantId()` - Helper para queries

2. **`lib/supabase/query-helpers.ts`** ⚠️ (NUEVO - Crear)
   - Wrapper functions para queries con tenant_id automático
   - `selectWithTenant(table, select, filters)`
   - `insertWithTenant(table, data)`
   - `updateWithTenant(table, id, data)`
   - `deleteWithTenant(table, id)`

---

## 📦 B) Inventory Module

### Archivos a modificar:

1. **`app/(dashboard)/inventory/InventoryList.tsx`**
   - ❌ Line 36: `.from('inventory_items').select('*')` - Sin tenant_id
   - ❌ Line 72: `.delete()` - Sin tenant_id filter
   - ❌ Line 94: `.update()` - Sin tenant_id filter

2. **`app/(dashboard)/inventory/InventoryForm.tsx`**
   - ❌ Line 43: `.update()` - Sin tenant_id
   - ❌ Line 54: `.insert()` - Sin tenant_id en data

3. **`app/(dashboard)/inventory/CSVImport.tsx`**
   - ❌ Line 77: `.insert()` - Sin tenant_id en data

4. **`app/(dashboard)/dashboard/page.tsx`**
   - ❌ Line 44: `.from('inventory_items').select()` - Sin tenant_id

**Total queries a actualizar:** 5

---

## 🔧 C) Maintenance Module

### Archivos a modificar:

1. **`app/(dashboard)/maintenance/MaintenanceList.tsx`**
   - ❌ Line 35: `.from('maintenance_tickets').select('*')` - Sin tenant_id
   - ❌ Line 36: `.from('vendors').select('*')` - Sin tenant_id
   - ❌ Line 74: `.delete()` - Sin tenant_id filter

2. **`app/(dashboard)/maintenance/TicketForm.tsx`**
   - ❌ Line 47: `.update()` - Sin tenant_id
   - ❌ Line 55: `.insert()` - Sin tenant_id en data

3. **`app/(dashboard)/dashboard/page.tsx`**
   - ❌ Line 45: `.from('maintenance_tickets').select()` - Sin tenant_id

**Total queries a actualizar:** 5

---

## 💰 D) Expenses/Costs Module

### Archivos a modificar:

1. **`app/(dashboard)/expenses/ExpensesManager.tsx`**
   - ❌ Line 28: `.from('expenses').select('*')` - Sin tenant_id
   - ❌ Line 29: `.from('vendors').select('*')` - Sin tenant_id
   - ❌ Line 30: `.from('maintenance_tickets').select('*')` - Sin tenant_id
   - ❌ Line 50: `.delete()` - Sin tenant_id filter

2. **`app/(dashboard)/expenses/ExpenseForm.tsx`**
   - ❌ Line 47: `.update()` - Sin tenant_id
   - ❌ Line 57: `.insert()` - Sin tenant_id en data

3. **`app/(dashboard)/reports/page.tsx`**
   - ❌ Line 74: `.from('expenses').select()` - Sin tenant_id
   - ❌ Line 113: `.from('maintenance_tickets').select()` - Sin tenant_id

4. **`app/(dashboard)/dashboard/page.tsx`**
   - ❌ Line 46: `.from('expenses').select()` - Sin tenant_id

**Total queries a actualizar:** 8

---

## 📅 E) Calendar/Bookings Module

### Archivos a modificar:

1. **`app/(dashboard)/rentals/page.tsx`**
   - ❌ Line 58: `.from('bookings').select('*')` - Sin tenant_id
   - ❌ Line 73: `.from('bookings').select('*')` - Sin tenant_id
   - ❌ Line 86: `.from('expenses').select('amount')` - Sin tenant_id
   - ❌ Line 116: `.update()` - Sin tenant_id filter
   - ❌ Line 131: `.insert()` - Sin tenant_id en data
   - ❌ Line 158: `.delete()` - Sin tenant_id filter

2. **`app/(dashboard)/dashboard/page.tsx`**
   - ❌ Line 47: `.from('bookings').select()` - Sin tenant_id

**Total queries a actualizar:** 6

---

## 🛒 F) ToBuy Module

### Archivos a modificar:

1. **`app/(dashboard)/to-buy/page.tsx`**
   - ❌ Line 38: `.from('purchase_items').select('*')` - Sin tenant_id
   - ❌ Line 77: `.update()` - Sin tenant_id filter
   - ❌ Line 85: `.insert()` - Sin tenant_id en data
   - ❌ Line 105: `.delete()` - Sin tenant_id filter

2. **`app/(dashboard)/dashboard/page.tsx`**
   - ❌ Line 48: `.from('purchase_items').select()` - Sin tenant_id

**Total queries a actualizar:** 5

---

## 🏢 Vendors Module (Extra)

### Archivos a modificar:

1. **`app/(dashboard)/vendors/VendorList.tsx`**
   - ❌ Line 29: `.from('vendors').select('*')` - Sin tenant_id
   - ❌ Line 56: `.delete()` - Sin tenant_id filter

2. **`app/(dashboard)/vendors/VendorForm.tsx`**
   - ❌ Line 39: `.update()` - Sin tenant_id
   - ❌ Line 49: `.insert()` - Sin tenant_id en data

**Total queries a actualizar:** 4

---

## 🎨 Hardcoded "Villa Serena/Sere" References

### Archivos a modificar:

1. **`app/LandingHome.tsx`**
   - ❌ Line 55: `"Villa Serena, always guest-ready."`
   - **Cambiar a:** Tenant name dinámico o genérico

2. **`app/(dashboard)/layout.tsx`**
   - ❌ Line 54: `"Villa Sere"`
   - ❌ Line 97: `"Villa Sere"`
   - **Cambiar a:** `{tenant?.name || 'Villa Management'}`

3. **`app/login/page.tsx`**
   - ❌ Line 94: `"Villa Sere"`
   - **Cambiar a:** Genérico o tenant name

4. **`app/layout.tsx`**
   - ❌ Line 17: `title: "Villa Sere Management"`
   - ❌ Line 23: `title: "Villa Sere"`
   - **Cambiar a:** Genérico

5. **`app/(dashboard)/dashboard/page.tsx`**
   - ❌ Line 103: `"Villa Sere Management Overview"`
   - **Cambiar a:** `{tenant?.name || 'Villa'} Management Overview`

6. **`app/(dashboard)/reports/page.tsx`**
   - ❌ Line 173: `'Villa Sere - Monthly Expense Report'`
   - **Cambiar a:** `{tenant?.name || 'Villa'} - Monthly Expense Report`

7. **`public/manifest.json`**
   - ❌ Line 2-3: `"Villa Sere Management"`
   - **Cambiar a:** Genérico

8. **`create-admin.js`** (Script, no crítico)
   - ❌ Line 49, 70: `'Villa Sere Administrator'`
   - **Cambiar a:** Genérico

**Total archivos con hardcoding:** 8

---

## 📋 Checklist por Módulo

### A) Lib/DB Helpers
- [ ] Crear `lib/supabase/query-helpers.ts`
- [ ] Implementar wrappers con tenant_id automático
- [ ] Test helpers

### B) Inventory
- [ ] `InventoryList.tsx` - 3 queries
- [ ] `InventoryForm.tsx` - 2 queries
- [ ] `CSVImport.tsx` - 1 query
- [ ] `dashboard/page.tsx` - 1 query (inventory)
- [ ] Test module completo

### C) Maintenance
- [ ] `MaintenanceList.tsx` - 3 queries
- [ ] `TicketForm.tsx` - 2 queries
- [ ] `dashboard/page.tsx` - 1 query (maintenance)
- [ ] Test module completo

### D) Expenses
- [ ] `ExpensesManager.tsx` - 4 queries
- [ ] `ExpenseForm.tsx` - 2 queries
- [ ] `reports/page.tsx` - 2 queries (expenses)
- [ ] `dashboard/page.tsx` - 1 query (expenses)
- [ ] Test module completo

### E) Bookings
- [ ] `rentals/page.tsx` - 6 queries
- [ ] `dashboard/page.tsx` - 1 query (bookings)
- [ ] Test module completo

### F) ToBuy
- [ ] `to-buy/page.tsx` - 4 queries
- [ ] `dashboard/page.tsx` - 1 query (purchase_items)
- [ ] Test module completo

### G) Vendors (Extra)
- [ ] `VendorList.tsx` - 2 queries
- [ ] `VendorForm.tsx` - 2 queries
- [ ] Test module completo

### H) Hardcoding
- [ ] `LandingHome.tsx`
- [ ] `layout.tsx` (dashboard)
- [ ] `login/page.tsx`
- [ ] `app/layout.tsx`
- [ ] `dashboard/page.tsx` (title)
- [ ] `reports/page.tsx`
- [ ] `manifest.json`

---

## 📊 Estadísticas

**Total queries a actualizar:** 39+  
**Total archivos con queries:** 15  
**Total archivos con hardcoding:** 8  
**Total archivos a modificar:** 23+

---

## 🎯 Orden de Commits/PRs

1. **Commit A:** `lib/supabase/query-helpers.ts` (helpers)
2. **Commit B:** Inventory module (5 queries)
3. **Commit C:** Maintenance module (5 queries)
4. **Commit D:** Expenses module (8 queries)
5. **Commit E:** Bookings module (6 queries)
6. **Commit F:** ToBuy module (5 queries)
7. **Commit G:** Vendors module (4 queries) - Opcional
8. **Commit H:** Remove hardcoding (8 archivos)

---

**Última actualización:** Enero 2025


