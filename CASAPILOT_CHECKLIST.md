# ✅ CasaPilot Transformation - Checklist Ejecutivo

## 📋 Resumen Ejecutivo

**Objetivo:** Transformar "Villa Sere Admin" → "CasaPilot" (SaaS multi-propiedad)

**Cambios principales:**
1. Renombrar app a "CasaPilot"
2. Eliminar hardcoding "Villa Serena/Sere"
3. Agregar soporte multi-propiedad (tenant_id + property_id)
4. Agregar selector de propiedad global

**Archivos totales:** 29 archivos (3 nuevos, 26 modificados)

---

## 🎯 FASE 1: Preparación ✅ COMPLETA

- [x] Inventario de módulos actuales
- [x] Mapa de tablas y dependencias
- [x] Lista de archivos con hardcoding
- [x] Definición de modelo multi-propiedad
- [x] Plan de estructura final
- [x] Checklist por fases

**Documentos creados:**
- ✅ `CASAPILOT_TRANSFORMATION_PLAN.md`
- ✅ `CASAPILOT_ARCHITECTURE_MAP.md`
- ✅ `CASAPILOT_CHECKLIST.md` (este archivo)

---

## 🗄️ FASE 2: Database Schema - Multi-Propiedad

**Objetivo:** Crear tabla `properties` y agregar `property_id` a tablas de negocio

### 2.1 Crear migración SQL

**Archivo:** `supabase-properties-migration.sql` (NUEVO)

- [ ] Crear tabla `properties`
  ```sql
  CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    photo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
  );
  ```

- [ ] Agregar `property_id` a tablas de negocio:
  - [ ] `expenses` (property_id UUID REFERENCES properties)
  - [ ] `maintenance_tickets` (property_id UUID REFERENCES properties)
  - [ ] `bookings` (property_id UUID REFERENCES properties)
  - [ ] `purchase_items` (property_id UUID REFERENCES properties)
  - [ ] `inventory_items` (property_id UUID REFERENCES properties)
  - [ ] `vendors` → NO (solo tenant_id, compartido)

- [ ] Agregar `preferred_property_id` a `profiles`
  ```sql
  ALTER TABLE profiles 
  ADD COLUMN preferred_property_id UUID REFERENCES properties(id);
  ```

- [ ] Crear índices:
  - [ ] `idx_properties_tenant_id`
  - [ ] `idx_expenses_property_id`
  - [ ] `idx_maintenance_tickets_property_id`
  - [ ] `idx_bookings_property_id`
  - [ ] `idx_purchase_items_property_id`
  - [ ] `idx_inventory_items_property_id`

- [ ] Actualizar RLS policies:
  - [ ] Policies para `properties` (tenant isolation)
  - [ ] Actualizar policies existentes para incluir `property_id`

### 2.2 Ejecutar migración

- [ ] Ejecutar `supabase-properties-migration.sql` en Supabase SQL Editor
- [ ] Verificar que tabla `properties` existe
- [ ] Verificar que todas las tablas tienen `property_id`
- [ ] Verificar que `profiles` tiene `preferred_property_id`
- [ ] Verificar índices creados
- [ ] Verificar RLS policies

**Archivos:** 1 nuevo (`supabase-properties-migration.sql`)

---

## 🛠️ FASE 3: Helpers y Utilities

**Objetivo:** Crear helpers para manejar propiedades y actualizar query-helpers

### 3.1 Crear `lib/utils/property.ts` (NUEVO)

- [ ] Función `getCurrentProperty()`
  ```typescript
  export async function getCurrentProperty(supabase: SupabaseClient) {
    // Obtener property_id de localStorage/cookies
    // O de preferred_property_id del profile
    // Retornar property object
  }
  ```

- [ ] Función `getCurrentPropertyId()`
  ```typescript
  export async function getCurrentPropertyId(supabase: SupabaseClient): Promise<string | null>
  ```

- [ ] Función `getUserProperties()`
  ```typescript
  export async function getUserProperties(supabase: SupabaseClient): Promise<Property[]>
  ```

- [ ] Función `setPreferredProperty()`
  ```typescript
  export async function setPreferredProperty(supabase: SupabaseClient, propertyId: string)
  ```

### 3.2 Actualizar `lib/supabase/query-helpers.ts`

- [ ] Agregar `property_id` a `selectWithTenant()` → `selectWithProperty()`
- [ ] Agregar `property_id` a `insertWithTenant()` → `insertWithProperty()`
- [ ] Agregar `property_id` a `updateWithTenant()` → `updateWithProperty()`
- [ ] Agregar `property_id` a `deleteWithTenant()` → `deleteWithProperty()`
- [ ] Agregar `property_id` a `upsertWithTenant()` → `upsertWithProperty()`
- [ ] Agregar `property_id` a `countWithTenant()` → `countWithProperty()`

**Nota:** Mantener funciones con `tenant_id` también (para vendors).

### 3.3 Actualizar `lib/types/database.ts`

- [ ] Agregar tipo `Property`:
  ```typescript
  export interface Property {
    id: string
    tenant_id: string
    name: string
    location?: string
    photo_url?: string
    settings?: Record<string, any>
    created_at: string
    updated_at: string
  }
  ```

- [ ] Actualizar tipos de tablas para incluir `property_id`:
  - [ ] `Expense` → agregar `property_id`
  - [ ] `MaintenanceTicket` → agregar `property_id`
  - [ ] `Booking` → agregar `property_id`
  - [ ] `PurchaseItem` → agregar `property_id`
  - [ ] `InventoryItem` → agregar `property_id`
  - [ ] `Profile` → agregar `preferred_property_id`

**Archivos:** 1 nuevo, 2 modificados

---

## 🎨 FASE 4: Componente PropertySelector

**Objetivo:** Crear selector de propiedad global y agregarlo al layout

### 4.1 Crear `components/PropertySelector.tsx` (NUEVO)

- [ ] Componente dropdown/select
- [ ] Cargar propiedades del usuario
- [ ] Guardar selección en localStorage/cookies
- [ ] Actualizar `preferred_property_id` en profile
- [ ] UI: Selector estilizado con Tailwind
- [ ] Manejar caso sin propiedades (crear primera)

### 4.2 Actualizar `app/(dashboard)/layout.tsx`

- [ ] Importar `PropertySelector`
- [ ] Agregar selector en header (desktop)
- [ ] Agregar selector en mobile menu
- [ ] Reemplazar "Villa Sere" hardcoded con:
  ```tsx
  {property?.name || 'CasaPilot'}
  ```

**Archivos:** 1 nuevo, 1 modificado

---

## 🔤 FASE 5: Eliminar Hardcoding "Villa Serena/Sere"

**Objetivo:** Reemplazar todos los textos hardcodeados con "CasaPilot" o dinámico

### 5.1 Archivos a modificar (8 archivos):

- [ ] `app/LandingHome.tsx`
  - [ ] Line 55: "Villa Serena, always guest-ready." → "CasaPilot, always guest-ready."

- [ ] `app/(dashboard)/layout.tsx`
  - [ ] Line 54: "Villa Sere" → `{property?.name || 'CasaPilot'}`
  - [ ] Line 97: "Villa Sere" → `{property?.name || 'CasaPilot'}`

- [ ] `app/login/page.tsx`
  - [ ] Line 94: "Villa Sere" → "CasaPilot"

- [ ] `app/layout.tsx`
  - [ ] Line 17: `title: "Villa Sere Management"` → `title: "CasaPilot"`
  - [ ] Line 23: `title: "Villa Sere"` → `title: "CasaPilot"`

- [ ] `app/(dashboard)/dashboard/page.tsx`
  - [ ] Line 103: "Villa Sere Management Overview" → `{property?.name || 'CasaPilot'} Management Overview`

- [ ] `app/(dashboard)/reports/page.tsx`
  - [ ] Line 173: "Villa Sere - Monthly Expense Report" → `{property?.name || 'CasaPilot'} - Monthly Expense Report`

- [ ] `public/manifest.json`
  - [ ] `"name": "Villa Sere Management"` → `"name": "CasaPilot"`
  - [ ] `"short_name": "Villa Sere"` → `"short_name": "CasaPilot"`

- [ ] `package.json`
  - [ ] Line 2: `"name": "villa-sere-admin"` → `"name": "casapilot"`

**Archivos:** 8 modificados

---

## 📦 FASE 6: Inventory Module - property_id

**Objetivo:** Agregar `property_id` a todas las queries del módulo Inventory

### 6.1 `app/(dashboard)/inventory/InventoryList.tsx`

- [ ] Agregar `getCurrentPropertyId()` al inicio del componente
- [ ] Agregar `.eq('property_id', propertyId)` a query de SELECT
- [ ] Verificar que filtros mantienen `property_id`

### 6.2 `app/(dashboard)/inventory/InventoryForm.tsx`

- [ ] Agregar `property_id` a INSERT
- [ ] Agregar `property_id` a UPDATE
- [ ] Obtener `property_id` con `getCurrentPropertyId()`

### 6.3 `app/(dashboard)/inventory/CSVImport.tsx`

- [ ] Agregar `property_id` a cada INSERT del CSV
- [ ] Obtener `property_id` con `getCurrentPropertyId()`

### 6.4 `app/(dashboard)/dashboard/page.tsx` (inventory query)

- [ ] Agregar `.eq('property_id', propertyId)` a query de inventory_items

**Archivos:** 4 modificados

---

## 🔧 FASE 7: Maintenance Module - property_id

**Objetivo:** Agregar `property_id` a todas las queries del módulo Maintenance

### 7.1 `app/(dashboard)/maintenance/MaintenanceList.tsx`

- [ ] Agregar `getCurrentPropertyId()` al inicio
- [ ] Agregar `.eq('property_id', propertyId)` a query de SELECT
- [ ] Verificar que filtros mantienen `property_id`

### 7.2 `app/(dashboard)/maintenance/TicketForm.tsx`

- [ ] Agregar `property_id` a INSERT
- [ ] Agregar `property_id` a UPDATE
- [ ] Obtener `property_id` con `getCurrentPropertyId()`

### 7.3 `app/(dashboard)/dashboard/page.tsx` (maintenance query)

- [ ] Agregar `.eq('property_id', propertyId)` a query de maintenance_tickets

**Archivos:** 3 modificados

---

## 💰 FASE 8: Expenses Module - property_id

**Objetivo:** Agregar `property_id` a todas las queries del módulo Expenses

### 8.1 `app/(dashboard)/expenses/ExpensesManager.tsx`

- [ ] Agregar `getCurrentPropertyId()` al inicio
- [ ] Agregar `.eq('property_id', propertyId)` a todas las queries
- [ ] Verificar que filtros mantienen `property_id`

### 8.2 `app/(dashboard)/expenses/ExpenseForm.tsx`

- [ ] Agregar `property_id` a INSERT
- [ ] Agregar `property_id` a UPDATE
- [ ] Obtener `property_id` con `getCurrentPropertyId()`

### 8.3 `app/(dashboard)/reports/page.tsx`

- [ ] Agregar `.eq('property_id', propertyId)` a queries de expenses
- [ ] Agregar `.eq('property_id', propertyId)` a queries de maintenance_tickets

### 8.4 `app/(dashboard)/dashboard/page.tsx` (expenses query)

- [ ] Agregar `.eq('property_id', propertyId)` a query de expenses

**Archivos:** 4 modificados

---

## 📅 FASE 9: Bookings Module - property_id

**Objetivo:** Agregar `property_id` a todas las queries del módulo Bookings

### 9.1 `app/(dashboard)/rentals/page.tsx`

- [ ] Agregar `getCurrentPropertyId()` al inicio
- [ ] Agregar `.eq('property_id', propertyId)` a todas las queries SELECT
- [ ] Agregar `property_id` a INSERT (BookingForm)
- [ ] Agregar `property_id` a UPDATE (BookingForm)
- [ ] Verificar BookingCalendar filtra por `property_id`
- [ ] Verificar BookingList filtra por `property_id`

### 9.2 `app/(dashboard)/dashboard/page.tsx` (bookings query)

- [ ] Agregar `.eq('property_id', propertyId)` a query de bookings

**Archivos:** 2 modificados

---

## 🛒 FASE 10: ToBuy Module - property_id

**Objetivo:** Agregar `property_id` a todas las queries del módulo ToBuy

### 10.1 `app/(dashboard)/to-buy/page.tsx`

- [ ] Agregar `getCurrentPropertyId()` al inicio
- [ ] Agregar `.eq('property_id', propertyId)` a query de SELECT
- [ ] Agregar `property_id` a INSERT (PurchaseItemForm)
- [ ] Agregar `property_id` a UPDATE (PurchaseItemForm)

### 10.2 `app/(dashboard)/dashboard/page.tsx` (purchase_items query)

- [ ] Agregar `.eq('property_id', propertyId)` a query de purchase_items

**Archivos:** 2 modificados

---

## 👥 FASE 11: Vendors Module - tenant_id

**Objetivo:** Verificar que vendors usa solo `tenant_id` (compartido)

### 11.1 `app/(dashboard)/vendors/VendorList.tsx`

- [ ] Verificar que query usa `.eq('tenant_id', tenantId)`
- [ ] Verificar que NO usa `property_id` (vendors es compartido)

### 11.2 `app/(dashboard)/vendors/VendorForm.tsx`

- [ ] Verificar que INSERT usa `tenant_id`
- [ ] Verificar que UPDATE usa `tenant_id`
- [ ] Verificar que NO usa `property_id`

**Archivos:** 2 modificados (solo verificación)

---

## 🧪 FASE 12: Testing y Verificación

**Objetivo:** Verificar que todo funciona correctamente

### 12.1 Setup de Testing

- [ ] Crear tenant de prueba
- [ ] Crear 2 propiedades en el tenant
- [ ] Crear usuario de prueba
- [ ] Asignar usuario al tenant

### 12.2 Verificación de Aislamiento

- [ ] Verificar que datos de Property 1 no aparecen en Property 2
- [ ] Verificar que selector de propiedad funciona
- [ ] Verificar que al cambiar propiedad, los datos cambian
- [ ] Verificar que vendors es compartido entre propiedades

### 12.3 Verificación de Queries

- [ ] Verificar que todas las queries incluyen `property_id`
- [ ] Verificar que todos los INSERT incluyen `property_id`
- [ ] Verificar que todos los UPDATE incluyen `property_id`
- [ ] Verificar que RLS policies funcionan

### 12.4 Verificación de UI

- [ ] Verificar que "Villa Serena" ya no aparece hardcodeado
- [ ] Verificar que nombre de propiedad aparece en header
- [ ] Verificar que PropertySelector funciona en mobile
- [ ] Verificar que PropertySelector funciona en desktop

### 12.5 Verificación de Funcionalidad

- [ ] Crear item en Inventory → verificar que tiene `property_id`
- [ ] Crear ticket en Maintenance → verificar que tiene `property_id`
- [ ] Crear expense → verificar que tiene `property_id`
- [ ] Crear booking → verificar que tiene `property_id`
- [ ] Crear purchase item → verificar que tiene `property_id`
- [ ] Crear vendor → verificar que tiene solo `tenant_id`

**Archivos:** 0 (solo testing)

---

## 📊 Resumen de Archivos por Fase

| Fase | Archivos Nuevos | Archivos Modificados | Total |
|------|----------------|---------------------|-------|
| Fase 1 | 0 | 0 | ✅ Completa |
| Fase 2 | 1 | 0 | 1 |
| Fase 3 | 1 | 2 | 3 |
| Fase 4 | 1 | 1 | 2 |
| Fase 5 | 0 | 8 | 8 |
| Fase 6 | 0 | 4 | 4 |
| Fase 7 | 0 | 3 | 3 |
| Fase 8 | 0 | 4 | 4 |
| Fase 9 | 0 | 2 | 2 |
| Fase 10 | 0 | 2 | 2 |
| Fase 11 | 0 | 2 | 2 |
| Fase 12 | 0 | 0 | 0 |
| **TOTAL** | **3** | **26** | **29** |

---

## 🎯 Orden de Ejecución Recomendado

1. ✅ **Fase 1** - Preparación (completa)
2. ⏳ **Fase 2** - Database schema
3. ⏳ **Fase 3** - Helpers
4. ⏳ **Fase 4** - PropertySelector
5. ⏳ **Fase 5** - Eliminar hardcoding
6. ⏳ **Fase 6-11** - Actualizar queries por módulo
7. ⏳ **Fase 12** - Testing

---

**Status:** Listo para comenzar Fase 2  
**Última actualización:** Enero 2025

