# 📊 Análisis de Tablas - Villa Sere Admin

## 📋 Tablas con Datos (Public Schema)

### Tablas que SÍ se eliminan (datos de negocio):

1. **`expenses`**
   - Descripción: Gastos de la villa
   - Foreign Keys:
     - `vendor_id` → `public.vendors(id)`
     - `ticket_id` → `public.maintenance_tickets(id)`
     - `created_by` → `auth.users(id)`
   - Storage: `receipt_url` (archivos en `attachments/receipts/`)

2. **`maintenance_tickets`**
   - Descripción: Tickets de mantenimiento
   - Foreign Keys:
     - `vendor_id` → `public.vendors(id)` (nullable)
     - `created_by` → `auth.users(id)`
   - Storage: `photo_url` (archivos en `attachments/maintenance/`)

3. **`bookings`**
   - Descripción: Reservas de la villa
   - Foreign Keys:
     - `created_by` → `auth.users(id)`
   - Storage: Ninguno

4. **`purchase_items`**
   - Descripción: Lista de compras (To Buy)
   - Foreign Keys:
     - `created_by` → `auth.users(id)`
   - Storage: Ninguno

5. **`inventory_items`**
   - Descripción: Items de inventario
   - Foreign Keys:
     - `created_by` → `auth.users(id)`
   - Storage: `photo_url` (archivos en `attachments/inventory/`)

6. **`vendors`**
   - Descripción: Proveedores
   - Foreign Keys:
     - `created_by` → `auth.users(id)`
   - Storage: Ninguno

### Tablas que NO se eliminan (sistema):

7. **`profiles`**
   - Descripción: Perfiles de usuario (extiende auth.users)
   - Foreign Keys:
     - `id` → `auth.users(id)` ON DELETE CASCADE
   - ⚠️ **NO SE ELIMINA** - Contiene usuarios del sistema

8. **`auth.users`** (Supabase Auth)
   - Descripción: Cuentas de autenticación
   - ⚠️ **NO SE ELIMINA** - Sistema de autenticación

---

## 🔗 Análisis de Dependencias (Foreign Keys)

### Gráfico de Dependencias:

```
auth.users (NO SE ELIMINA)
  ├── profiles (NO SE ELIMINA)
  ├── vendors (SE ELIMINA)
  │   └── maintenance_tickets (SE ELIMINA)
  │       └── expenses (SE ELIMINA) ──┐
  │                                   │
  │   └── expenses (SE ELIMINA) ──────┘
  ├── inventory_items (SE ELIMINA)
  ├── bookings (SE ELIMINA)
  └── purchase_items (SE ELIMINA)
```

### Dependencias Detalladas:

**expenses** depende de:
- ✅ `vendors` (vendor_id)
- ✅ `maintenance_tickets` (ticket_id)
- ✅ `auth.users` (created_by) - NO bloquea

**maintenance_tickets** depende de:
- ✅ `vendors` (vendor_id) - nullable, pero puede tener referencias
- ✅ `auth.users` (created_by) - NO bloquea

**bookings** depende de:
- ✅ `auth.users` (created_by) - NO bloquea
- ✅ **Independiente** de otras tablas

**purchase_items** depende de:
- ✅ `auth.users` (created_by) - NO bloquea
- ✅ **Independiente** de otras tablas

**inventory_items** depende de:
- ✅ `auth.users` (created_by) - NO bloquea
- ✅ **Independiente** de otras tablas

**vendors** depende de:
- ✅ `auth.users` (created_by) - NO bloquea
- ⚠️ **Referenciado por:** `expenses`, `maintenance_tickets`

---

## 📊 Orden de Eliminación Propuesto

### Orden Correcto (Respetando Foreign Keys):

```
1. expenses
   └─ Razón: Depende de vendors y maintenance_tickets
   └─ Storage: attachments/receipts/

2. maintenance_tickets
   └─ Razón: Depende de vendors (nullable, pero puede tener referencias)
   └─ Storage: attachments/maintenance/

3. bookings
   └─ Razón: Solo depende de auth.users (no bloquea)
   └─ Storage: Ninguno

4. purchase_items
   └─ Razón: Solo depende de auth.users (no bloquea)
   └─ Storage: Ninguno

5. inventory_items
   └─ Razón: Solo depende de auth.users (no bloquea)
   └─ Storage: attachments/inventory/

6. vendors
   └─ Razón: Ya no tiene referencias activas
   └─ Storage: Ninguno
```

### Tablas que NO se tocan:

- ❌ `profiles` - Usuarios del sistema
- ❌ `auth.users` - Sistema de autenticación
- ❌ Schema, RLS policies, triggers, funciones

---

## 🗑️ Storage Buckets a Limpiar

### Bucket: `attachments`

Carpetas a limpiar (en orden):
1. `receipts/` - Recibos de expenses
2. `maintenance/` - Fotos de maintenance_tickets
3. `inventory/` - Fotos de inventory_items

---

## ✅ Resumen

**Total de tablas con datos:** 6 tablas  
**Total de tablas del sistema:** 2 tablas (no se tocan)  
**Orden de eliminación:** 6 pasos  
**Storage folders:** 3 carpetas

**Tiempo estimado:** < 5 segundos (depende del volumen de datos)

---

**Última actualización:** Enero 2025

