# 🗺️ CasaPilot - Architecture Map

## 📊 Mapa de Módulos Actuales

### Módulos Identificados (8 módulos):

```
Dashboard App
├── 📅 Calendar/Rentals (/rentals)
│   ├── BookingCalendar.tsx
│   ├── BookingForm.tsx
│   ├── BookingList.tsx
│   └── page.tsx
│   └── Tabla: bookings
│
├── 🔧 Maintenance (/maintenance)
│   ├── MaintenanceList.tsx
│   ├── TicketForm.tsx
│   ├── TicketCard.tsx
│   └── page.tsx
│   └── Tablas: maintenance_tickets, vendors
│
├── 📦 Inventory (/inventory)
│   ├── InventoryList.tsx
│   ├── InventoryForm.tsx
│   ├── CSVImport.tsx
│   ├── QuickAdjust.tsx
│   └── page.tsx
│   └── Tabla: inventory_items
│
├── 💰 Expenses/Costs (/expenses)
│   ├── ExpensesManager.tsx
│   ├── ExpenseForm.tsx
│   ├── ExpenseList.tsx
│   ├── MonthlySummary.tsx
│   └── page.tsx
│   └── Tablas: expenses, vendors, maintenance_tickets
│
├── 🛒 ToBuy (/to-buy)
│   ├── PurchaseItemForm.tsx
│   └── page.tsx
│   └── Tabla: purchase_items
│
├── 👥 Vendors (/vendors)
│   ├── VendorList.tsx
│   ├── VendorForm.tsx
│   └── page.tsx
│   └── Tabla: vendors
│
├── 📊 Reports (/reports)
│   └── page.tsx
│   └── Tablas: expenses, maintenance_tickets, inventory_items
│
└── 🏠 Dashboard (/dashboard)
    ├── page.tsx
    ├── ResetDataButton.tsx
    └── Tablas: todas (vista agregada)
```

---

## 🗄️ Tablas de Base de Datos

### Tablas de Negocio (6 tablas):

| Tabla | Módulos que la usan | FK Actuales | FK Futuras |
|-------|---------------------|-------------|------------|
| `bookings` | Rentals, Dashboard | auth.users | tenant_id, property_id |
| `maintenance_tickets` | Maintenance, Expenses, Dashboard | vendors, auth.users | tenant_id, property_id |
| `inventory_items` | Inventory, Reports, Dashboard | auth.users | tenant_id, property_id |
| `expenses` | Expenses, Reports, Dashboard | vendors, maintenance_tickets, auth.users | tenant_id, property_id |
| `purchase_items` | ToBuy, Dashboard | auth.users | tenant_id, property_id |
| `vendors` | Vendors, Maintenance, Expenses | auth.users | tenant_id (compartido) |

### Tablas del Sistema (3 tablas):

| Tabla | Propósito | Cambios Necesarios |
|-------|-----------|-------------------|
| `tenants` | Organizaciones | ✅ Ya existe (de migración multi-tenant) |
| `profiles` | Perfiles de usuario | Agregar `preferred_property_id` |
| `properties` | Propiedades/Villas | ⚠️ **NUEVA** - Crear en Fase 2 |

---

## 🔄 Flujo de Datos Actual vs Futuro

### Actual (Single-Property):
```
User → Profile → [Datos sin tenant/property]
```

### Futuro (Multi-Property):
```
User → Profile → Tenant → Property (seleccionada) → [Datos filtrados por tenant_id + property_id]
```

---

## 📁 Estructura de Archivos Actual

```
app/
├── (dashboard)/
│   ├── layout.tsx                    ← Navegación + header
│   ├── dashboard/
│   │   ├── page.tsx                  ← Dashboard principal
│   │   └── ResetDataButton.tsx
│   ├── inventory/
│   │   ├── page.tsx
│   │   ├── InventoryList.tsx
│   │   ├── InventoryForm.tsx
│   │   ├── CSVImport.tsx
│   │   └── QuickAdjust.tsx
│   ├── maintenance/
│   │   ├── page.tsx
│   │   ├── MaintenanceList.tsx
│   │   ├── TicketForm.tsx
│   │   └── TicketCard.tsx
│   ├── expenses/
│   │   ├── page.tsx
│   │   ├── ExpensesManager.tsx
│   │   ├── ExpenseForm.tsx
│   │   ├── ExpenseList.tsx
│   │   └── MonthlySummary.tsx
│   ├── rentals/
│   │   ├── page.tsx
│   │   ├── BookingCalendar.tsx
│   │   ├── BookingForm.tsx
│   │   └── BookingList.tsx
│   ├── to-buy/
│   │   ├── page.tsx
│   │   └── PurchaseItemForm.tsx
│   ├── vendors/
│   │   ├── page.tsx
│   │   ├── VendorList.tsx
│   │   └── VendorForm.tsx
│   └── reports/
│       └── page.tsx
├── login/
│   └── page.tsx
├── auth/
│   └── callback/
│       └── route.ts
├── layout.tsx
├── page.tsx
└── LandingHome.tsx

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── middleware.ts
│   └── query-helpers.ts              ← Ya tiene tenant_id
├── utils/
│   ├── tenant.ts                     ← Ya existe
│   ├── property.ts                   ← NUEVO
│   ├── csv.ts
│   └── export.ts
├── types/
│   └── database.ts
└── constants.ts

components/
└── ui/                               ← 8 componentes reutilizables
    ├── Button.tsx
    ├── Card.tsx
    ├── EmptyState.tsx
    ├── Input.tsx
    ├── Loading.tsx
    ├── Select.tsx
    ├── Textarea.tsx
    └── Toast.tsx
```

---

## 🎯 Cambios Requeridos por Módulo

### Calendar/Rentals
- ✅ Agregar `property_id` a queries
- ✅ Agregar `property_id` a inserts
- ✅ Filtrar por propiedad activa

### Maintenance
- ✅ Agregar `property_id` a queries
- ✅ Agregar `property_id` a inserts
- ✅ Filtrar por propiedad activa

### Inventory
- ✅ Agregar `property_id` a queries
- ✅ Agregar `property_id` a inserts
- ✅ Filtrar por propiedad activa

### Expenses
- ✅ Agregar `property_id` a queries
- ✅ Agregar `property_id` a inserts
- ✅ Filtrar por propiedad activa

### ToBuy
- ✅ Agregar `property_id` a queries
- ✅ Agregar `property_id` a inserts
- ✅ Filtrar por propiedad activa

### Vendors
- ✅ Solo `tenant_id` (compartido entre propiedades)
- ✅ No necesita `property_id`

### Reports
- ✅ Agregar `property_id` a queries
- ✅ Filtrar por propiedad activa

### Dashboard
- ✅ Agregar `property_id` a todas las queries
- ✅ Mostrar nombre de propiedad activa

---

## 🔍 Componentes Repetidos (Reutilizables)

**Ya existen y funcionan bien:**
- ✅ Button.tsx - Usado en todos los módulos
- ✅ Card.tsx - Usado en dashboard, reports
- ✅ Input.tsx - Usado en todos los forms
- ✅ Select.tsx - Usado en filters y forms
- ✅ Textarea.tsx - Usado en forms
- ✅ Loading.tsx - Usado en listas
- ✅ EmptyState.tsx - Usado en listas vacías
- ✅ Toast.tsx - Usado para notificaciones

**No hay duplicación innecesaria** - Estructura actual es buena.

---

## 📝 Archivos con Hardcoding (8 archivos)

1. `app/LandingHome.tsx` - "Villa Serena"
2. `app/(dashboard)/layout.tsx` - "Villa Sere" (2 lugares)
3. `app/login/page.tsx` - "Villa Sere"
4. `app/layout.tsx` - "Villa Sere Management" (metadata)
5. `app/(dashboard)/dashboard/page.tsx` - "Villa Sere Management Overview"
6. `app/(dashboard)/reports/page.tsx` - "Villa Sere - Monthly Expense Report"
7. `public/manifest.json` - "Villa Sere Management"
8. `package.json` - "villa-sere-admin"

**Reemplazo:** Usar `{property?.name || 'CasaPilot'}` o simplemente "CasaPilot"

---

**Última actualización:** Enero 2025


