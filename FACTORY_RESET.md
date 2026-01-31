# 🏭 Factory Reset & Seed Data

Scripts para resetear y poblar datos de prueba en la aplicación Villa Sere Admin.

## ⚠️ Advertencia

**El script de Factory Reset elimina TODOS los datos de la base de datos.**  
Solo úsalo en desarrollo o cuando necesites empezar desde cero.

---

## 📋 Requisitos Previos

### 1. Configurar Variables de Entorno

Agrega la clave de servicio de Supabase a tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

**¿Dónde conseguir la Service Role Key?**
- Ve a tu proyecto en Supabase
- Settings → API
- Copia la **service_role** key (⚠️ secreta, no la compartas)

### 2. Verificar Acceso

El script usa la service role key para tener permisos de administrador y poder eliminar todos los datos.

---

## 🗑️ Factory Reset

Elimina todos los datos de la base de datos y archivos en storage.

### ¿Qué elimina?

**Tablas (datos):**
- ✅ `expenses`
- ✅ `maintenance_tickets`
- ✅ `bookings`
- ✅ `purchase_items`
- ✅ `inventory_items`
- ✅ `vendors`

**Storage:**
- ✅ Todos los archivos en el bucket `attachments/`
  - `inventory/` (fotos de items)
  - `maintenance/` (fotos de tickets)
  - `receipts/` (recibos de gastos)

### ¿Qué NO elimina?

- ✅ `profiles` (perfiles de usuario)
- ✅ `auth.users` (cuentas de usuario)
- ✅ Schema de base de datos
- ✅ RLS policies
- ✅ Funciones y triggers

### Uso

```bash
npm run reset:data
```

### Proceso de Confirmación

El script requiere **doble confirmación** para evitar eliminaciones accidentales:

1. **Primera confirmación:** Debes escribir `RESET` (todo en mayúsculas)
2. **Segunda confirmación:** Debes escribir `YES` (todo en mayúsculas)

Si no confirmas correctamente, el script se cancela automáticamente.

### Ejemplo de Ejecución

```bash
$ npm run reset:data

========================================
🏭 Factory Reset - Villa Sere Admin
========================================

🔐 Verifying admin access...
✅ Service role key verified

⚠️  ⚠️  ⚠️  WARNING: FACTORY RESET ⚠️  ⚠️  ⚠️

This will DELETE ALL DATA from:
  - expenses
  - maintenance_tickets
  - bookings
  - purchase_items
  - inventory_items
  - vendors
  - All files in storage bucket "attachments"

This will NOT delete:
  - User accounts (profiles, auth.users)
  - Database schema
  - RLS policies

⚠️  This action CANNOT be undone! ⚠️

Type "RESET" (all caps) to confirm: RESET

Are you absolutely sure? Type "YES" to proceed: YES

🗑️  Starting database reset...
Deleting tables in order (respecting foreign keys)...

  Deleting from expenses...
  ✅ expenses: Deleted 15 row(s)
  Deleting from maintenance_tickets...
  ✅ maintenance_tickets: Deleted 8 row(s)
  Deleting from bookings...
  ✅ bookings: Deleted 12 row(s)
  Deleting from purchase_items...
  ✅ purchase_items: Deleted 5 row(s)
  Deleting from inventory_items...
  ✅ inventory_items: Deleted 25 row(s)
  Deleting from vendors...
  ✅ vendors: Deleted 6 row(s)

✅ Database reset complete

🗑️  Cleaning storage bucket "attachments"...
  ✅ inventory/: Deleted 10 file(s)
  ✅ maintenance/: Deleted 3 file(s)
  ✅ receipts/: Deleted 5 file(s)

✅ Storage cleanup complete: 18 file(s) deleted

========================================
✅ Factory Reset Complete!
========================================

All data has been deleted.
User accounts and schema remain intact.

You can now start fresh or run the seed script.
```

---

## 🌱 Seed Data

Crea datos de ejemplo para probar la aplicación rápidamente.

### ¿Qué crea?

- ✅ **5 vendors** (proveedores de ejemplo)
- ✅ **10 inventory items** (items de inventario)
- ✅ **4 maintenance tickets** (tickets de mantenimiento)
- ✅ **3 bookings** (reservas próximas)
- ✅ **4 expenses** (gastos de ejemplo)
- ✅ **4 purchase items** (items para comprar)

### Uso

```bash
npm run seed:data
```

### Requisitos

- La base de datos debe estar vacía (o puedes ejecutar el reset primero)
- Debe existir al menos un usuario en `profiles` (para el campo `created_by`)

### Ejemplo de Ejecución

```bash
$ npm run seed:data

========================================
🌱 Seed Data - Villa Sere Admin
========================================

📦 Seeding vendors...
✅ Created 5 vendor(s)

📦 Seeding inventory items...
✅ Created 10 inventory item(s)

🔧 Seeding maintenance tickets...
✅ Created 4 maintenance ticket(s)

📅 Seeding bookings...
✅ Created 3 booking(s)

💰 Seeding expenses...
✅ Created 4 expense(s)

🛒 Seeding purchase items...
✅ Created 4 purchase item(s)

========================================
✅ Seed Complete!
========================================

Created:
  - 5 vendor(s)
  - 10 inventory item(s)
  - 4 maintenance ticket(s)
  - 3 booking(s)
  - 4 expense(s)
  - 4 purchase item(s)

You can now test the application with sample data!
```

---

## 🔄 Flujo Recomendado

### Para empezar desde cero:

```bash
# 1. Resetear todos los datos
npm run reset:data

# 2. Poblar con datos de ejemplo
npm run seed:data

# 3. Iniciar la aplicación
npm run dev
```

### Para solo agregar datos de ejemplo:

```bash
# Solo ejecutar seed (fallará si hay datos existentes con conflictos)
npm run seed:data
```

---

## 🛡️ Seguridad

### Protecciones Implementadas

1. **Verificación de Service Role Key**
   - El script verifica que la clave sea válida antes de proceder

2. **Doble Confirmación**
   - Requiere escribir `RESET` y luego `YES`
   - Cualquier otra entrada cancela el proceso

3. **Orden de Eliminación**
   - Respeta las foreign keys
   - Elimina en el orden correcto para evitar errores

4. **Solo Datos, No Schema**
   - No toca la estructura de la base de datos
   - No elimina usuarios ni perfiles
   - No modifica RLS policies

### Buenas Prácticas

- ✅ **Solo en desarrollo:** No ejecutes en producción
- ✅ **Backup antes:** Si tienes datos importantes, haz backup primero
- ✅ **Service Role Key secreta:** Nunca la compartas ni la subas a Git
- ✅ **Verifica .env.local:** Asegúrate de tener las variables correctas

---

## 🐛 Troubleshooting

### Error: "Missing required environment variables"

**Solución:** Agrega `SUPABASE_SERVICE_ROLE_KEY` a tu `.env.local`

### Error: "Invalid service role key"

**Solución:** Verifica que la clave sea correcta en Supabase Dashboard → Settings → API

### Error: "Foreign key constraint violation"

**Solución:** El script debería manejar esto automáticamente. Si ocurre, verifica que el orden de eliminación sea correcto.

### Error: "Storage bucket not found"

**Solución:** El bucket `attachments` debe existir. Créalo en Supabase Dashboard → Storage si no existe.

---

## 📝 Notas Técnicas

### Orden de Eliminación (Factory Reset)

El script elimina las tablas en este orden para respetar foreign keys:

1. `expenses` (depende de vendors y maintenance_tickets)
2. `maintenance_tickets` (depende de vendors)
3. `bookings` (solo depende de auth.users)
4. `purchase_items` (solo depende de auth.users)
5. `inventory_items` (solo depende de auth.users)
6. `vendors` (solo depende de auth.users)

### Orden de Creación (Seed)

El script crea datos en este orden para respetar dependencias:

1. `vendors` (necesario para otras tablas)
2. `inventory_items` (independiente)
3. `maintenance_tickets` (usa vendors)
4. `bookings` (independiente)
5. `expenses` (usa vendors y tickets)
6. `purchase_items` (independiente)

---

## ✅ Checklist

Antes de ejecutar el reset:

- [ ] Tienes la `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
- [ ] Estás en un entorno de desarrollo (no producción)
- [ ] Has hecho backup de datos importantes (si aplica)
- [ ] Entiendes que se eliminarán TODOS los datos
- [ ] Estás listo para escribir `RESET` y `YES` cuando se solicite

---

**Última actualización:** Enero 2025  
**Versión:** 1.0.0

