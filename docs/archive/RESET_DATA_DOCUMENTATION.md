# 🗑️ Reset All Data - Documentation

## 📋 Overview

Script SQL para borrar **TODOS** los datos de negocio, manteniendo el schema intacto.

---

## ✅ Tablas INCLUIDAS (Datos eliminados)

### Tablas de Negocio (6 tablas):

1. **`expenses`**
   - Todos los gastos
   - FK: vendors, maintenance_tickets
   - Sequence reset: `expenses_id_seq`

2. **`maintenance_tickets`**
   - Todos los tickets de mantenimiento
   - FK: vendors
   - Sequence reset: `maintenance_tickets_id_seq`

3. **`bookings`**
   - Todas las reservas
   - FK: auth.users (no bloquea)
   - Sequence reset: `bookings_id_seq`

4. **`purchase_items`**
   - Todos los items de "To Buy"
   - FK: auth.users (no bloquea)
   - Sequence reset: `purchase_items_id_seq`

5. **`inventory_items`**
   - Todos los items de inventario
   - FK: auth.users (no bloquea)
   - Sequence reset: `inventory_items_id_seq`

6. **`vendors`**
   - Todos los proveedores
   - FK: auth.users (no bloquea)
   - Sequence reset: `vendors_id_seq`

**Total:** 6 tablas de negocio → **0 registros**

---

## ❌ Tablas EXCLUIDAS (Datos preservados)

### Tablas del Sistema:

1. **`tenants`**
   - ✅ **PRESERVADO** - Organizaciones/tenants
   - Razón: Necesario para multi-tenant

2. **`profiles`**
   - ✅ **PRESERVADO** - Perfiles de usuario
   - Razón: Usuarios del sistema

3. **`auth.users`**
   - ✅ **PRESERVADO** - Cuentas de autenticación
   - Razón: Sistema de autenticación

### Schema/Infraestructura:

- ✅ **Todas las tablas** (estructura)
- ✅ **RLS Policies** (políticas de seguridad)
- ✅ **Functions** (funciones SQL)
- ✅ **Triggers** (disparadores)
- ✅ **Indexes** (índices)
- ✅ **Sequences** (reseteadas, pero preservadas)

---

## 🔄 Orden de Eliminación

El script elimina en este orden para respetar foreign keys:

```
1. expenses          → Depende de vendors y maintenance_tickets
2. maintenance_tickets → Depende de vendors
3. bookings         → Solo auth.users (independiente)
4. purchase_items   → Solo auth.users (independiente)
5. inventory_items  → Solo auth.users (independiente)
6. vendors          → Solo auth.users (independiente)
```

---

## 🔧 Características del Script

### 1. Transacción Segura
- Usa `BEGIN` / `COMMIT`
- Si falla, hace rollback automático
- No deja datos parciales

### 2. Reset de Sequences
- Resetea todas las secuencias de IDs
- Empiezan desde 1 en nuevos registros

### 3. Verificación Automática
- Muestra conteo después de eliminar
- Confirma que todas las tablas están vacías

### 4. Sin CASCADE
- No usa `CASCADE` en DELETE
- Elimina en orden correcto manualmente
- Más control y seguridad

---

## 📊 Resultado Esperado

### Antes:
```
expenses: 150 registros
maintenance_tickets: 45 registros
bookings: 80 registros
purchase_items: 25 registros
inventory_items: 200 registros
vendors: 15 registros
```

### Después:
```
expenses: 0 registros ✅
maintenance_tickets: 0 registros ✅
bookings: 0 registros ✅
purchase_items: 0 registros ✅
inventory_items: 0 registros ✅
vendors: 0 registros ✅
```

### Preservado:
```
tenants: X registros (sin cambios)
profiles: X registros (sin cambios)
auth.users: X registros (sin cambios)
Schema: 100% intacto ✅
```

---

## 🚀 Uso

### Paso 1: Abrir Supabase SQL Editor
1. Ve a tu proyecto en Supabase
2. Click en **SQL Editor**
3. Click en **New Query**

### Paso 2: Ejecutar Script
1. Copia todo el contenido de `RESET_ALL_DATA.sql`
2. Pega en el SQL Editor
3. Click en **Run** (o `Cmd/Ctrl + Enter`)

### Paso 3: Verificar
El script mostrará en los logs:
```
Verification:
  expenses: 0 rows
  maintenance_tickets: 0 rows
  bookings: 0 rows
  purchase_items: 0 rows
  inventory_items: 0 rows
  vendors: 0 rows
✅ All business data deleted successfully
```

---

## ⚠️ Advertencias

### ⚠️ Irreversible
- **NO se puede deshacer**
- Los datos eliminados **NO se pueden recuperar**
- Asegúrate de tener backup si necesitas los datos

### ⚠️ Storage Files
- Este script **NO elimina archivos** en Storage
- Si quieres limpiar Storage también:
  - Ve a Storage → attachments
  - Elimina manualmente las carpetas:
    - `inventory/`
    - `maintenance/`
    - `receipts/`

### ⚠️ Tenants Preservados
- Los tenants (organizaciones) **NO se eliminan**
- Los usuarios **NO se eliminan**
- Solo se eliminan los datos de negocio

---

## ✅ Checklist Pre-Ejecución

Antes de ejecutar:

- [ ] Tienes backup de datos importantes (si aplica)
- [ ] Entiendes que es irreversible
- [ ] Sabes que tenants/profiles se preservan
- [ ] Estás listo para empezar con datos vacíos
- [ ] Has verificado que es el proyecto correcto

---

## 📝 Notas Técnicas

### Por qué TRUNCATE CASCADE:
- `TRUNCATE CASCADE` es más eficiente:
  - Mucho más rápido que DELETE
  - Maneja foreign keys automáticamente con CASCADE
  - Resetea sequences automáticamente
  - Funciona perfectamente con RLS
- `DELETE` sería más lento:
  - Procesa fila por fila
  - Más lento en tablas grandes
  - Requiere más recursos

### Sequences:
- PostgreSQL usa sequences para UUIDs (gen_random_uuid())
- Algunas tablas pueden no tener sequences explícitas
- El script verifica antes de resetear
- Si no existe la sequence, simplemente continúa

---

## 🎯 Resultado Final

Después de ejecutar:

✅ **Schema intacto** - Todas las tablas, RLS, functions, triggers  
✅ **Multi-tenant funcionando** - Tenants preservados  
✅ **App funcionando** - Código sin cambios  
✅ **Datos vacíos** - 0 registros en tablas de negocio  
✅ **Listo para producción** - Estado limpio para nuevos usuarios  

---

**Última actualización:** Enero 2025  
**Script:** `RESET_ALL_DATA.sql`

