# 📋 Lista de Tablas - Reset All Data

## ✅ Tablas INCLUIDAS (Datos eliminados)

### Tablas de Negocio (6 tablas):

| Tabla | Descripción | FK Dependencias | Sequence |
|-------|-------------|-----------------|----------|
| `expenses` | Gastos de la villa | vendors, maintenance_tickets | expenses_id_seq |
| `maintenance_tickets` | Tickets de mantenimiento | vendors | maintenance_tickets_id_seq |
| `bookings` | Reservas/calendario | auth.users | bookings_id_seq |
| `purchase_items` | Lista de compras (To Buy) | auth.users | purchase_items_id_seq |
| `inventory_items` | Items de inventario | auth.users | inventory_items_id_seq |
| `vendors` | Proveedores | auth.users | vendors_id_seq |

**Total:** 6 tablas → **0 registros después del reset**

---

## ❌ Tablas EXCLUIDAS (Datos preservados)

### Tablas del Sistema:

| Tabla | Descripción | Razón |
|-------|-------------|-------|
| `tenants` | Organizaciones/tenants | Necesario para multi-tenant |
| `profiles` | Perfiles de usuario | Usuarios del sistema |
| `auth.users` | Cuentas de autenticación | Sistema de autenticación |

### Infraestructura (100% preservada):

- ✅ Todas las tablas (estructura/schema)
- ✅ RLS Policies (políticas de seguridad)
- ✅ Functions (funciones SQL)
- ✅ Triggers (disparadores)
- ✅ Indexes (índices)
- ✅ Sequences (reseteadas, pero preservadas)
- ✅ Constraints (restricciones)
- ✅ Types/Enums (tipos personalizados)

---

## 🔄 Orden de Eliminación

El script usa `TRUNCATE CASCADE` que maneja automáticamente:

```
TRUNCATE TABLE 
  expenses,           → CASCADE elimina dependencias
  maintenance_tickets, → CASCADE elimina dependencias
  bookings,           → Independiente
  purchase_items,     → Independiente
  inventory_items,    → Independiente
  vendors             → Independiente
CASCADE;
```

**Nota:** CASCADE maneja automáticamente las foreign keys entre estas tablas.

---

## 📊 Resumen

**Eliminadas:** 6 tablas de negocio  
**Preservadas:** 3 tablas del sistema + toda la infraestructura  
**Resultado:** Base de datos vacía de contenido de negocio, lista para producción

---

**Script:** `RESET_ALL_DATA.sql`


