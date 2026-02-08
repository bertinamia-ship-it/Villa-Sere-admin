# 📋 Lista Completa de Tablas - Schema Public

## 🔍 Todas las Tablas en `public` Schema

Esta lista incluye **todas** las tablas que existen o pueden existir en el schema `public`.

---

## ✅ Tablas de Negocio (Se ELIMINAN)

### Tablas Principales:

1. **`expenses`**
   - FK: `vendor_id` → vendors, `ticket_id` → maintenance_tickets
   - tenant_id: ✅ (después de migración)
   - Storage: `receipt_url` → `attachments/receipts/`

2. **`maintenance_tickets`**
   - FK: `vendor_id` → vendors
   - tenant_id: ✅ (después de migración)
   - Storage: `photo_url` → `attachments/maintenance/`

3. **`bookings`**
   - FK: `created_by` → auth.users
   - tenant_id: ✅ (después de migración)
   - Storage: Ninguno

4. **`purchase_items`**
   - FK: `created_by` → auth.users
   - tenant_id: ✅ (después de migración)
   - Storage: Ninguno

5. **`inventory_items`**
   - FK: `created_by` → auth.users
   - tenant_id: ✅ (después de migración)
   - Storage: `photo_url` → `attachments/inventory/`

6. **`vendors`**
   - FK: `created_by` → auth.users
   - tenant_id: ✅ (después de migración)
   - Storage: Ninguno

### Tablas Potenciales (Si existen):

7. **`properties`** (si se creó)
   - FK: `owner_id` → auth.users
   - tenant_id: ✅ (si existe)
   - **Acción:** ELIMINAR si existe

8. **`categories`** (si se creó)
   - FK: Posible `tenant_id`
   - **Acción:** ELIMINAR si existe

9. **`inventory_locations`** (si se creó)
   - FK: Posible `tenant_id`
   - **Acción:** ELIMINAR si existe

10. **`maintenance_comments`** (si se creó)
    - FK: `ticket_id` → maintenance_tickets
    - **Acción:** ELIMINAR si existe

11. **`attachments`** (si es tabla, no bucket)
    - FK: Posible a varias tablas
    - **Acción:** ELIMINAR si existe

12. **`logs`** o `audit_logs` (si se creó)
    - FK: Posible `tenant_id` o `user_id`
    - **Acción:** ELIMINAR si existe (logs de negocio)

13. **Join tables** (si existen):
    - `tenant_users` (many-to-many)
    - `property_users` (many-to-many)
    - Cualquier tabla con `_` en el nombre que sea join
    - **Acción:** ELIMINAR si existen

---

## ❌ Tablas EXCLUIDAS (Se PRESERVAN)

### Tablas del Sistema:

1. **`tenants`**
   - Razón: Organizaciones/tenants (necesario para multi-tenant)
   - **Acción:** PRESERVAR

2. **`profiles`**
   - Razón: Perfiles de usuario
   - **Acción:** PRESERVAR

3. **`auth.users`** (schema auth, no public)
   - Razón: Sistema de autenticación
   - **Acción:** PRESERVAR

### Tablas de Sistema PostgreSQL (automáticamente excluidas):

- Todas las tablas en schemas: `information_schema`, `pg_catalog`, `pg_toast`
- Tablas de extensiones
- Tablas de sistema de Supabase

---

## 🔍 Criterios de Auto-Detección

El script `RESET_ALL_BUSINESS_DATA.sql` detecta automáticamente tablas que:

### Criterio 1: Tienen `tenant_id`
```sql
SELECT table_name
FROM information_schema.columns
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
  AND table_name NOT IN ('tenants', 'profiles')
```

### Criterio 2: Tienen FK a `tenants`
```sql
SELECT DISTINCT tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'tenants'
  AND tc.table_name != 'tenants'
```

### Criterio 3: Tienen FK a `profiles` (excepto profiles)
```sql
SELECT DISTINCT tc.table_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'profiles'
  AND tc.table_name != 'profiles'
```

### Criterio 4: Lista conocida (fallback)
- expenses
- maintenance_tickets
- bookings
- purchase_items
- inventory_items
- vendors

---

## 📊 Resumen

**Total tablas conocidas:** 6-13+ (depende de migraciones adicionales)  
**Tablas siempre excluidas:** 2 (tenants, profiles)  
**Auto-detección:** ✅ Cubre todas las variantes

---

## ✅ Verificación Post-Ejecución

Después de ejecutar el script, verifica:

```sql
-- Ver todas las tablas en public
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name 
        AND column_name = 'tenant_id') as has_tenant_id
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Todas las tablas de negocio deben tener 0 registros.

---

**Última actualización:** Enero 2025


