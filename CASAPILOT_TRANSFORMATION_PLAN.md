# 🏢 CasaPilot Transformation Plan

## 📋 Inventario de Arquitectura Actual

### 1. Módulos Actuales

| Módulo | Ruta | Componentes Principales | Tablas Usadas |
|--------|------|------------------------|---------------|
| **Calendar/Rentals** | `/rentals` | BookingCalendar, BookingForm, BookingList | `bookings` |
| **Maintenance** | `/maintenance` | MaintenanceList, TicketForm, TicketCard | `maintenance_tickets`, `vendors` |
| **Inventory** | `/inventory` | InventoryList, InventoryForm, CSVImport, QuickAdjust | `inventory_items` |
| **Costs/Expenses** | `/expenses` | ExpensesManager, ExpenseForm, ExpenseList, MonthlySummary | `expenses`, `vendors`, `maintenance_tickets` |
| **ToBuy** | `/to-buy` | PurchaseItemForm | `purchase_items` |
| **Vendors** | `/vendors` | VendorList, VendorForm | `vendors` |
| **Reports** | `/reports` | ReportsPage | `expenses`, `maintenance_tickets`, `inventory_items` |
| **Dashboard** | `/dashboard` | DashboardPage, ResetDataButton | Todas las tablas |

### 2. Tablas de Negocio Actuales

**Tablas con datos:**
- `expenses` - FK: vendors, maintenance_tickets
- `maintenance_tickets` - FK: vendors
- `bookings` - FK: auth.users
- `purchase_items` - FK: auth.users
- `inventory_items` - FK: auth.users
- `vendors` - FK: auth.users

**Tablas del sistema:**
- `tenants` - Organizaciones (ya existe en migración)
- `profiles` - Perfiles de usuario
- `auth.users` - Autenticación

### 3. Componentes Reutilizables

**UI Components (`components/ui/`):**
- Button.tsx
- Card.tsx
- EmptyState.tsx
- Input.tsx
- Loading.tsx
- Select.tsx
- Textarea.tsx
- Toast.tsx

**Helpers (`lib/`):**
- `supabase/client.ts` - Cliente browser
- `supabase/server.ts` - Cliente server
- `supabase/query-helpers.ts` - Helpers con tenant_id
- `utils/tenant.ts` - Helpers de tenant
- `utils/csv.ts` - Export CSV
- `utils/export.ts` - Export utilities
- `constants.ts` - Constantes (CATEGORIES, ROOMS, etc.)

### 4. Archivos con Hardcoding "Villa Serena/Sere"

**Archivos a modificar:**
1. `app/LandingHome.tsx` - Line 55: "Villa Serena, always guest-ready."
2. `app/(dashboard)/layout.tsx` - Lines 54, 97: "Villa Sere"
3. `app/login/page.tsx` - Line 94: "Villa Sere"
4. `app/layout.tsx` - Lines 17, 23: "Villa Sere Management"
5. `app/(dashboard)/dashboard/page.tsx` - Line 103: "Villa Sere Management Overview"
6. `app/(dashboard)/reports/page.tsx` - Line 173: "Villa Sere - Monthly Expense Report"
7. `public/manifest.json` - Lines 2-3: "Villa Sere Management"
8. `package.json` - Line 2: "villa-sere-admin"

---

## 🏗️ Modelo SaaS Multi-Propiedad

### Estructura de Datos

```
tenants (organizaciones)
  ├── id (UUID, PK)
  ├── name (ej: "CasaPilot Organization")
  ├── slug (URL-friendly)
  ├── owner_id (FK → auth.users)
  ├── subscription_status
  └── subscription_plan

properties (propiedades/villas)
  ├── id (UUID, PK)
  ├── tenant_id (FK → tenants) ⭐
  ├── name (ej: "Villa Serena", "Beach House")
  ├── location
  ├── photo_url
  └── settings (JSONB)

profiles (usuarios)
  ├── id (FK → auth.users)
  ├── tenant_id (FK → tenants) ⭐
  ├── preferred_property_id (FK → properties, nullable)
  └── role

Todas las tablas de negocio:
  ├── tenant_id (FK → tenants) ⭐
  ├── property_id (FK → properties) ⭐
  └── ... (resto de campos)
```

### Tablas que necesitan `property_id`:

1. `expenses` - tenant_id + property_id
2. `maintenance_tickets` - tenant_id + property_id
3. `bookings` - tenant_id + property_id
4. `purchase_items` - tenant_id + property_id
5. `inventory_items` - tenant_id + property_id
6. `vendors` - tenant_id (compartido entre propiedades del tenant)

**Nota:** `vendors` solo tiene `tenant_id` (compartido), no `property_id`.

---

## 📝 Lista de Archivos a Modificar

### A) Eliminar Hardcoding "Villa Serena/Sere"

**Archivos (8 archivos):**
1. `app/LandingHome.tsx`
2. `app/(dashboard)/layout.tsx`
3. `app/login/page.tsx`
4. `app/layout.tsx`
5. `app/(dashboard)/dashboard/page.tsx`
6. `app/(dashboard)/reports/page.tsx`
7. `public/manifest.json`
8. `package.json`

### B) Agregar Selector de Propiedad (Global)

**Archivos nuevos (2 archivos):**
1. `lib/utils/property.ts` - Helpers de propiedad
2. `components/PropertySelector.tsx` - Selector global

**Archivos a modificar (3 archivos):**
1. `app/(dashboard)/layout.tsx` - Agregar selector en header
2. `lib/supabase/query-helpers.ts` - Agregar property_id a queries
3. `lib/utils/tenant.ts` - Agregar helpers de propiedad

### C) Actualizar Queries para property_id

**Archivos (15 archivos):**
1. `app/(dashboard)/dashboard/page.tsx`
2. `app/(dashboard)/inventory/InventoryList.tsx`
3. `app/(dashboard)/inventory/InventoryForm.tsx`
4. `app/(dashboard)/inventory/CSVImport.tsx`
5. `app/(dashboard)/maintenance/MaintenanceList.tsx`
6. `app/(dashboard)/maintenance/TicketForm.tsx`
7. `app/(dashboard)/expenses/ExpensesManager.tsx`
8. `app/(dashboard)/expenses/ExpenseForm.tsx`
9. `app/(dashboard)/rentals/page.tsx`
10. `app/(dashboard)/to-buy/page.tsx`
11. `app/(dashboard)/vendors/VendorList.tsx`
12. `app/(dashboard)/vendors/VendorForm.tsx`
13. `app/(dashboard)/reports/page.tsx`
14. `lib/supabase/query-helpers.ts`
15. `lib/types/database.ts`

---

## 📁 Propuesta de Estructura Final

### Estructura Actual (Mantener):
```
app/
├── (dashboard)/
│   ├── layout.tsx              ← Agregar PropertySelector
│   ├── dashboard/
│   ├── inventory/
│   ├── maintenance/
│   ├── expenses/
│   ├── rentals/
│   ├── to-buy/
│   ├── vendors/
│   └── reports/
├── login/
├── auth/
└── layout.tsx

components/
└── ui/                          ← Mantener como está

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── query-helpers.ts         ← Actualizar para property_id
├── utils/
│   ├── tenant.ts                ← Mantener
│   ├── property.ts              ← NUEVO
│   ├── csv.ts
│   └── export.ts
├── types/
│   └── database.ts              ← Actualizar tipos
└── constants.ts                 ← Mantener
```

### NO crear:
- ❌ Nueva carpeta `/features/` (aún no necesario)
- ❌ Duplicar componentes existentes
- ❌ Nuevos archivos de configuración innecesarios

### Estructura mínima (solo lo necesario):
- ✅ Mantener estructura actual
- ✅ Agregar solo `lib/utils/property.ts` y `components/PropertySelector.tsx`
- ✅ Modificar archivos existentes

---

## ✅ Checklist por Fases

### FASE 1: Preparación y Análisis ✅

- [x] Inventario de módulos actuales
- [x] Mapa de tablas y dependencias
- [x] Lista de archivos con hardcoding
- [x] Definición de modelo multi-propiedad
- [x] Plan de estructura final

---

### FASE 2: Database Schema (Multi-Propiedad)

**Objetivo:** Agregar `properties` table y `property_id` a todas las tablas de negocio

**Archivos SQL:**
- [ ] Crear `supabase-properties-migration.sql`
  - [ ] Tabla `properties` (tenant_id, name, location, photo_url, settings)
  - [ ] Agregar `property_id` a: expenses, maintenance_tickets, bookings, purchase_items, inventory_items
  - [ ] `vendors` solo tenant_id (compartido)
  - [ ] Agregar `preferred_property_id` a profiles
  - [ ] Actualizar RLS policies para property_id
  - [ ] Crear índices

**Ejecución:**
- [ ] Ejecutar migración en Supabase SQL Editor
- [ ] Verificar tablas creadas
- [ ] Verificar RLS policies

---

### FASE 3: Helpers y Utilities

**Archivos a crear/modificar:**
- [ ] `lib/utils/property.ts` (NUEVO)
  - [ ] `getCurrentProperty()` - Obtener propiedad activa
  - [ ] `getCurrentPropertyId()` - Obtener property_id
  - [ ] `getUserProperties()` - Listar propiedades del usuario
  - [ ] `setPreferredProperty()` - Guardar preferencia

- [ ] `lib/supabase/query-helpers.ts` (MODIFICAR)
  - [ ] Agregar `property_id` a todos los helpers
  - [ ] `selectWithProperty()` - SELECT con tenant_id + property_id
  - [ ] `insertWithProperty()` - INSERT con tenant_id + property_id
  - [ ] Actualizar todos los helpers existentes

- [ ] `lib/utils/tenant.ts` (MODIFICAR)
  - [ ] Agregar helpers relacionados con propiedades

- [ ] `lib/types/database.ts` (MODIFICAR)
  - [ ] Agregar tipo `Property`
  - [ ] Actualizar tipos de tablas con `property_id`

---

### FASE 4: Componente PropertySelector

**Archivos:**
- [ ] `components/PropertySelector.tsx` (NUEVO)
  - [ ] Dropdown/Select de propiedades
  - [ ] Guardar en localStorage/cookies
  - [ ] Context/Provider para propiedad activa
  - [ ] UI: Selector en header del layout

**Integración:**
- [ ] `app/(dashboard)/layout.tsx` (MODIFICAR)
  - [ ] Agregar PropertySelector en header
  - [ ] Reemplazar "Villa Sere" con nombre de propiedad activa

---

### FASE 5: Eliminar Hardcoding

**Archivos a modificar (8 archivos):**
- [ ] `app/LandingHome.tsx`
  - [ ] Reemplazar "Villa Serena" con nombre genérico o dinámico
- [ ] `app/(dashboard)/layout.tsx`
  - [ ] Reemplazar "Villa Sere" con `{property?.name || 'CasaPilot'}`
- [ ] `app/login/page.tsx`
  - [ ] Reemplazar "Villa Sere" con "CasaPilot"
- [ ] `app/layout.tsx`
  - [ ] Reemplazar "Villa Sere Management" con "CasaPilot"
- [ ] `app/(dashboard)/dashboard/page.tsx`
  - [ ] Reemplazar "Villa Sere Management Overview" con dinámico
- [ ] `app/(dashboard)/reports/page.tsx`
  - [ ] Reemplazar "Villa Sere - Monthly Expense Report" con dinámico
- [ ] `public/manifest.json`
  - [ ] Reemplazar "Villa Sere Management" con "CasaPilot"
- [ ] `package.json`
  - [ ] Reemplazar "villa-sere-admin" con "casapilot"

---

### FASE 6: Actualizar Queries - Inventory Module

**Archivos (4 archivos):**
- [ ] `app/(dashboard)/inventory/InventoryList.tsx`
  - [ ] Agregar `getCurrentPropertyId()` al inicio
  - [ ] Agregar `.eq('property_id', propertyId)` a queries
  - [ ] Agregar `property_id` a inserts
- [ ] `app/(dashboard)/inventory/InventoryForm.tsx`
  - [ ] Agregar `property_id` a inserts/updates
- [ ] `app/(dashboard)/inventory/CSVImport.tsx`
  - [ ] Agregar `property_id` a inserts
- [ ] `app/(dashboard)/dashboard/page.tsx` (inventory query)
  - [ ] Agregar filtro `property_id`

---

### FASE 7: Actualizar Queries - Maintenance Module

**Archivos (3 archivos):**
- [ ] `app/(dashboard)/maintenance/MaintenanceList.tsx`
  - [ ] Agregar `property_id` a queries
- [ ] `app/(dashboard)/maintenance/TicketForm.tsx`
  - [ ] Agregar `property_id` a inserts/updates
- [ ] `app/(dashboard)/dashboard/page.tsx` (maintenance query)
  - [ ] Agregar filtro `property_id`

---

### FASE 8: Actualizar Queries - Expenses Module

**Archivos (4 archivos):**
- [ ] `app/(dashboard)/expenses/ExpensesManager.tsx`
  - [ ] Agregar `property_id` a queries
- [ ] `app/(dashboard)/expenses/ExpenseForm.tsx`
  - [ ] Agregar `property_id` a inserts/updates
- [ ] `app/(dashboard)/reports/page.tsx`
  - [ ] Agregar `property_id` a queries
- [ ] `app/(dashboard)/dashboard/page.tsx` (expenses query)
  - [ ] Agregar filtro `property_id`

---

### FASE 9: Actualizar Queries - Bookings Module

**Archivos (2 archivos):**
- [ ] `app/(dashboard)/rentals/page.tsx`
  - [ ] Agregar `property_id` a todas las queries
  - [ ] Agregar `property_id` a inserts/updates
- [ ] `app/(dashboard)/dashboard/page.tsx` (bookings query)
  - [ ] Agregar filtro `property_id`

---

### FASE 10: Actualizar Queries - ToBuy Module

**Archivos (2 archivos):**
- [ ] `app/(dashboard)/to-buy/page.tsx`
  - [ ] Agregar `property_id` a queries
  - [ ] Agregar `property_id` a inserts/updates
- [ ] `app/(dashboard)/dashboard/page.tsx` (purchase_items query)
  - [ ] Agregar filtro `property_id`

---

### FASE 11: Actualizar Queries - Vendors Module

**Archivos (2 archivos):**
- [ ] `app/(dashboard)/vendors/VendorList.tsx`
  - [ ] Agregar `tenant_id` a queries (vendors es compartido)
- [ ] `app/(dashboard)/vendors/VendorForm.tsx`
  - [ ] Agregar `tenant_id` a inserts/updates

**Nota:** Vendors solo usa `tenant_id` (compartido entre propiedades).

---

### FASE 12: Testing y Verificación

- [ ] Crear test tenant
- [ ] Crear 2 propiedades en el tenant
- [ ] Verificar aislamiento de datos por propiedad
- [ ] Verificar selector de propiedad funciona
- [ ] Verificar que queries filtran correctamente
- [ ] Verificar que inserts incluyen property_id
- [ ] Verificar RLS policies
- [ ] Verificar que "Villa Serena" ya no aparece hardcodeado

---

## 📊 Resumen de Archivos por Fase

### Archivos Nuevos (3):
1. `supabase-properties-migration.sql`
2. `lib/utils/property.ts`
3. `components/PropertySelector.tsx`

### Archivos a Modificar (26):
- Helpers: 3 archivos
- Queries: 15 archivos
- Hardcoding: 8 archivos

### Total: 29 archivos

---

## 🎯 Orden de Commits Sugerido

1. **Commit 1:** Fase 2 - Database schema (properties migration)
2. **Commit 2:** Fase 3 - Helpers (property.ts, query-helpers.ts)
3. **Commit 3:** Fase 4 - PropertySelector component
4. **Commit 4:** Fase 5 - Remove hardcoding (8 archivos)
5. **Commit 5:** Fase 6 - Inventory module
6. **Commit 6:** Fase 7 - Maintenance module
7. **Commit 7:** Fase 8 - Expenses module
8. **Commit 8:** Fase 9 - Bookings module
9. **Commit 9:** Fase 10 - ToBuy module
10. **Commit 10:** Fase 11 - Vendors module
11. **Commit 11:** Fase 12 - Testing fixes

---

**Status:** Plan completo, listo para implementación  
**Última actualización:** Enero 2025


