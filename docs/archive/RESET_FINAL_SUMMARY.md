# 🗑️ Reset All Business Data - Summary

## ✅ Script Creado

**Archivo:** `RESET_ALL_BUSINESS_DATA.sql`

### Características:
- ✅ **Auto-detección** de tablas de negocio
- ✅ **TRUNCATE CASCADE** (rápido y seguro)
- ✅ **Reset de sequences** automático
- ✅ **Verificación** post-ejecución
- ✅ **Transacción segura** (BEGIN/COMMIT)

---

## 🔍 Criterios de Auto-Detección

El script detecta automáticamente tablas que:

1. **Tienen columna `tenant_id`**
2. **Tienen FK a tabla `tenants`**
3. **Tienen FK a tabla `profiles`** (excepto profiles mismo)
4. **Lista conocida** (fallback): expenses, maintenance_tickets, bookings, purchase_items, inventory_items, vendors

---

## ❌ Tablas EXCLUIDAS (Preservadas)

### Tablas del Sistema (NUNCA se eliminan):

| Tabla | Schema | Razón |
|-------|--------|-------|
| `tenants` | public | Organizaciones/tenants (multi-tenant) |
| `profiles` | public | Perfiles de usuario |
| `auth.users` | auth | Sistema de autenticación |

### Tablas de Sistema PostgreSQL (automáticamente excluidas):
- Todas en `information_schema`
- Todas en `pg_catalog`
- Todas en `pg_toast`
- Extensiones del sistema

---

## ✅ Tablas INCLUIDAS (Eliminadas)

### Detectadas Automáticamente:

El script detectará y eliminará **TODAS** las tablas que cumplan los criterios, incluyendo:

**Tablas conocidas:**
- expenses
- maintenance_tickets
- bookings
- purchase_items
- inventory_items
- vendors

**Tablas potenciales (si existen):**
- properties
- categories
- inventory_locations
- maintenance_comments
- attachments (si es tabla)
- logs / audit_logs
- Cualquier join table
- **Cualquier otra tabla con tenant_id o FK a tenants/profiles**

---

## 🪣 Storage Cleanup Checklist

### Bucket: `attachments`

**Carpetas a limpiar manualmente:**

1. **`inventory/`**
   - Fotos de items de inventario
   - Campo: `inventory_items.photo_url`
   - **Acción:** Eliminar todos los archivos

2. **`maintenance/`**
   - Fotos de tickets de mantenimiento
   - Campo: `maintenance_tickets.photo_url`
   - **Acción:** Eliminar todos los archivos

3. **`receipts/`**
   - Recibos de gastos (PDFs, imágenes)
   - Campo: `expenses.receipt_url`
   - **Acción:** Eliminar todos los archivos

### Pasos en Supabase:

1. Ve a **Storage** → **attachments**
2. Para cada carpeta (`inventory/`, `maintenance/`, `receipts/`):
   - Click en la carpeta
   - Selecciona todos los archivos
   - Click en **Delete**
   - Confirma

**O alternativamente:**
- Elimina el bucket completo
- Recrea el bucket con las mismas configuraciones

---

## 📋 Checklist Completo

### Pre-Ejecución:
- [ ] Backup de datos importantes (si aplica)
- [ ] Verificado que es el proyecto correcto
- [ ] Entendido que es irreversible

### Ejecución SQL:
- [ ] Abierto Supabase SQL Editor
- [ ] Copiado `RESET_ALL_BUSINESS_DATA.sql`
- [ ] Ejecutado el script
- [ ] Verificado logs (debe mostrar tablas detectadas)
- [ ] Verificado que todas las tablas están en 0

### Limpieza Storage:
- [ ] Eliminados archivos en `attachments/inventory/`
- [ ] Eliminados archivos en `attachments/maintenance/`
- [ ] Eliminados archivos en `attachments/receipts/`
- [ ] Verificado que bucket está vacío

### Post-Limpieza:
- [ ] Verificado que app funciona
- [ ] Probado signup nuevo (debe crear tenant vacío)
- [ ] Confirmado estado vacío en cuenta nueva

---

## 🎯 Resultado Esperado

### Después del Reset:

**Base de Datos:**
- ✅ Todas las tablas de negocio: **0 registros**
- ✅ Tenants preservados (organizaciones)
- ✅ Profiles preservados (usuarios)
- ✅ Schema intacto (tablas, RLS, functions, triggers)

**Storage:**
- ✅ Bucket `attachments` vacío o solo estructura
- ✅ Listo para nuevos uploads

**Aplicación:**
- ✅ Funciona normalmente
- ✅ Nuevos signups crean tenants vacíos
- ✅ Estado vacío en cuentas nuevas

---

## 📝 Documentación Relacionada

- `RESET_ALL_BUSINESS_DATA.sql` - Script SQL principal
- `STORAGE_CLEANUP_CHECKLIST.md` - Guía detallada de Storage
- `ALL_TABLES_LIST.md` - Lista completa de tablas conocidas

---

**Status:** ✅ Listo para ejecutar  
**Última actualización:** Enero 2025


