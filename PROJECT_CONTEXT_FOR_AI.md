# 🏢 CasaPilot - Contexto Completo del Proyecto

## 🔗 Link del Repositorio
**GitHub:** https://github.com/bertinamia-ship-it/Villa-Sere-admin.git

---

## 📋 RESUMEN EJECUTIVO

**CasaPilot** es una aplicación SaaS multi-tenant y multi-property para la gestión integral de propiedades (villas, departamentos, casas). Permite gestionar inventario, mantenimientos, reservas, gastos, proveedores, tareas recurrentes y reportes, todo desde una interfaz unificada.

**Estado:** ✅ Producción - App completa y funcional
**Stack:** Next.js 16 + TypeScript + Supabase + Tailwind CSS
**Arquitectura:** Multi-tenant SaaS con soporte multi-property

---

## 🏗️ ARQUITECTURA

### Multi-Tenant + Multi-Property

**Concepto:**
- **Tenant** = Organización/Cliente (ej: "Hotel ABC", "Propietario XYZ")
- **Property** = Propiedad individual dentro de un tenant (ej: "Villa Serena", "Casa Playa")
- Cada tenant puede tener múltiples properties
- Todos los datos están aislados por `tenant_id` y `property_id`

**Tablas principales:**
- `tenants` - Organizaciones
- `profiles` - Usuarios (con `tenant_id` y `preferred_property_id`)
- `properties` - Propiedades (FK a `tenant_id`)
- Tablas de negocio: `bookings`, `expenses`, `maintenance_tickets`, `inventory_items`, `purchase_items`, `tasks`, `maintenance_plans`, `vendors`

**Aislamiento:**
- RLS (Row Level Security) en todas las tablas
- Helpers automáticos: `insertWithProperty`, `selectWithProperty`, `updateWithProperty`, `deleteWithProperty`
- `vendors` solo tiene `tenant_id` (compartidos entre properties del mismo tenant)

---

## 🛠️ STACK TECNOLÓGICO

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **Lenguaje:** TypeScript 5
- **UI:** Tailwind CSS 4
- **Iconos:** Lucide React
- **Estado:** React Hooks (useState, useEffect)
- **Navegación:** Next.js App Router con layouts anidados

### Backend
- **BaaS:** Supabase
  - **Auth:** Supabase Auth (email/password)
  - **Database:** PostgreSQL con RLS
  - **Storage:** Supabase Storage (fotos, recibos)
- **Cliente:** `@supabase/ssr` para server components, `@supabase/supabase-js` para client

### Deployment
- **Plataforma:** Vercel (recomendado)
- **PWA:** Configurado (manifest.json, service worker ready)

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
Villa-Sere-admin/
├── app/
│   ├── (dashboard)/              # Rutas protegidas del dashboard
│   │   ├── layout.tsx            # Layout principal con sidebar
│   │   ├── dashboard/            # Dashboard principal
│   │   ├── calendario/           # Calendario unificado (SPRINT 2)
│   │   ├── inventory/            # Gestión de inventario
│   │   ├── maintenance/          # Tickets de mantenimiento
│   │   ├── maintenance-plans/    # Mantenimientos recurrentes
│   │   ├── tasks/                # Tareas operativas
│   │   ├── expenses/             # Gastos y movimientos
│   │   ├── rentals/              # Reservas/Bookings
│   │   ├── to-buy/               # Lista de compras
│   │   ├── vendors/              # Proveedores
│   │   ├── reports/              # Reportes y analíticas
│   │   └── billing/              # Facturación (básico)
│   ├── login/                    # Página de login
│   ├── page.tsx                  # Landing page
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── ui/                       # Componentes UI reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   └── ...
│   ├── calendar/                 # Componentes del calendario
│   │   ├── CalendarView.tsx
│   │   ├── CalendarItemModal.tsx
│   │   └── types.ts
│   ├── PropertySelector.tsx      # Selector de propiedad activa
│   ├── Header.tsx                # Header del dashboard
│   └── TenantError.tsx           # Error cuando falta tenant_id
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente browser
│   │   ├── server.ts              # Cliente server
│   │   └── query-helpers.ts       # Helpers con tenant/property
│   ├── utils/
│   │   ├── property.ts            # Helpers server-side (property)
│   │   ├── property-client.ts     # Helpers client-side (property)
│   │   ├── tenant.ts              # Helpers de tenant
│   │   ├── download.ts           # Generación de nombres de archivo
│   │   └── export.ts              # Exportación CSV
│   ├── i18n/
│   │   └── es.ts                  # Todas las traducciones en español
│   ├── constants.ts               # Constantes (categorías, prioridades, etc.)
│   └── types/
│       └── database.ts            # Tipos TypeScript de las tablas
│
└── supabase-*.sql                # Migraciones SQL
```

---

## 🎯 MÓDULOS PRINCIPALES

### 1. **Dashboard** (`/dashboard`)
- Vista general con métricas clave
- Hero summary: Ingresos, Gastos, Balance (mes actual)
- Cards: Rentas, Mantenimiento, Inventario, To-Buy
- Widgets: Próximos mantenimientos, Próximas tareas
- Quick actions

### 2. **Calendario Unificado** (`/calendario`) ⭐ NUEVO
- Muestra bookings, maintenance_plans y tasks en un solo calendario
- Filtros: Hoy | Semana | Mes
- Toggle: "Solo esta propiedad" vs "Todas mis propiedades"
- Chips por evento (máx 3 + "+X más")
- Click en chip → modal con acciones rápidas
- Botón "+ Nuevo" con menú: Renta, Tarea, Ticket, Mantenimiento

### 3. **Inventario** (`/inventory`)
- Lista de artículos con categorías y ubicaciones
- Ajuste rápido de cantidades
- Alertas de stock bajo
- Importación CSV
- Exportación CSV
- Fotos por artículo

### 4. **Mantenimiento** (`/maintenance`)
- **Tabs:** Tickets | Recurrentes
- **Tickets:** Lista de tickets con prioridades, estados, fotos
- **Recurrentes:** Planes de mantenimiento con frecuencia
- Plantillas inteligentes (12 predefinidas)
- Crear ticket desde plan recurrente
- Link a proveedores

### 5. **Tareas** (`/tasks`)
- Tareas operativas (una vez o recurrentes)
- Filtros: Hoy, Esta semana, Vencidas, Todas
- Cadencia: diaria, semanal, mensual, anual
- Asignación y prioridades
- Recalculo automático de `next_due_date`

### 6. **Gastos/Movimientos** (`/expenses`)
- Registro de gastos con categorías
- Link a proveedores y tickets
- Resumen mensual
- Exportación CSV
- Fotos de recibos

### 7. **Reservas** (`/rentals`)
- Calendario de ocupación
- Lista de bookings
- Validación de overlaps (misma propiedad)
- Estadísticas mensuales
- Estados: confirmed, cancelled, completed

### 8. **Proveedores** (`/vendors`)
- Directorio de proveedores
- Contactos (teléfono, email, WhatsApp)
- Compartidos por tenant (no por property)
- Link desde expenses y maintenance

### 9. **Compras** (`/to-buy`)
- Lista de compras pendientes
- Estados: Por comprar, Ordenado, Recibido
- Costos estimados
- Links a productos

### 10. **Reportes** (`/reports`)
- Resumen mensual de gastos
- Análisis por categoría y proveedor
- Costos de mantenimiento
- Insights de inventario
- Exportación CSV con nombre de propiedad

### 11. **Facturación** (`/billing`)
- Estado de suscripción
- Límites por plan (free/trial: 1 property, 1 user)
- Trial period (14 días)
- Placeholder para integración de pagos

---

## 🔑 CONCEPTOS CLAVE

### Property Context (Contexto de Propiedad)
- Cada usuario tiene un `preferred_property_id` en su perfil
- Se guarda en `localStorage` para acceso rápido
- Evento global `propertyChanged` para refrescar componentes
- Helpers: `getActivePropertyId()`, `getActiveProperty()`

### Query Helpers
Todas las queries usan helpers que automáticamente incluyen `tenant_id` y `property_id`:

```typescript
// Para tablas con property_id
selectWithProperty('inventory_items', '*', { category: 'Kitchen' })
insertWithProperty('expenses', { amount: 100, date: '2026-01-01' })
updateWithProperty('bookings', bookingId, { status: 'confirmed' })
deleteWithProperty('tasks', taskId)

// Para tablas solo con tenant_id (vendors)
selectWithTenant('vendors', '*')
insertWithTenant('vendors', { company_name: 'Plumber Co' })
```

### Internacionalización (i18n)
- **100% en español**
- Archivo central: `lib/i18n/es.ts`
- Helper: `t('key.path')` para acceder a traducciones
- Interpolación: `t('dashboard.subtitle', { propertyName: 'Villa Serena' })`

### UI Components
Todos los componentes UI están en `components/ui/`:
- **Button:** Variantes: primary, secondary, ghost, danger
- **Card:** Con padding options (sm, md, lg)
- **Modal:** Con ESC, click outside, focus trap
- **Toast:** Notificaciones con animaciones
- **Input, Select, Textarea:** Formularios consistentes
- **EmptyState:** Estados vacíos con CTAs
- **Skeleton:** Loading states

### Estilo Premium
- **Paleta:**
  - Primary: `#0F172A` (slate-900)
  - Secondary: `#2563EB` (blue-600)
  - Accent: `#22C55E` (emerald-600)
  - Danger: `#EF4444` (red-600)
  - Warning: `#F59E0B` (amber-500)
  - Background: `#F8FAFC` (slate-50)
  - Borders: `#E2E8F0` (slate-200)
- **Tipografía:** Consistente, jerarquía clara
- **Animaciones:** Transiciones suaves (150-200ms)
- **Responsive:** Mobile-first, perfecto en todos los dispositivos

---

## 🗄️ BASE DE DATOS

### Tablas Principales

**Sistema:**
- `tenants` - Organizaciones
- `profiles` - Usuarios (con `tenant_id`, `preferred_property_id`)
- `properties` - Propiedades (FK a `tenant_id`)

**Negocio (con `tenant_id` + `property_id`):**
- `bookings` - Reservas
- `expenses` - Gastos
- `maintenance_tickets` - Tickets de mantenimiento
- `inventory_items` - Artículos de inventario
- `purchase_items` - Lista de compras
- `tasks` - Tareas operativas
- `maintenance_plans` - Planes de mantenimiento recurrentes

**Negocio (solo `tenant_id`):**
- `vendors` - Proveedores (compartidos)

**Relaciones:**
- `maintenance_plan_runs` - Ejecuciones de planes (FK a `maintenance_plans`)

### RLS (Row Level Security)
Todas las tablas tienen políticas RLS que:
1. Aíslan por `tenant_id` (nunca un tenant ve datos de otro)
2. Filtran por `property_id` cuando aplica
3. Permiten SELECT/INSERT/UPDATE/DELETE según rol

### Funciones SQL
- `handle_new_user()` - Crea tenant y profile al registrarse
- `is_tenant_active()` - Verifica si tenant está activo (trial/active)
- `calculate_next_run_date()` - Calcula próxima fecha de mantenimiento
- `calculate_next_due_date()` - Calcula próxima fecha de tarea

---

## 🚀 FEATURES RECIENTES

### SPRINT 1: Simplificar UX
- ✅ Sidebar compacta con secciones colapsables
- ✅ Mantenimiento con tabs internos (Tickets | Recurrentes)
- ✅ Header simplificado (sin duplicar nombre de propiedad)
- ✅ PropertySelector compacto

### SPRINT 2: Calendario Unificado
- ✅ Vista única de bookings + maintenance + tasks
- ✅ Filtros por vista (Hoy/Semana/Mes)
- ✅ Toggle "Solo esta propiedad"
- ✅ Acciones rápidas desde modal
- ✅ Menú "+ Nuevo" integrado

### Plantillas Inteligentes
- ✅ 12 plantillas predefinidas de mantenimiento
- ✅ Prefill automático del formulario
- ✅ Sin tablas nuevas (hardcoded en constants)

---

## 🔐 SEGURIDAD

### Autenticación
- Supabase Auth (email/password)
- Roles: `admin`, `staff` (en `profiles.role`)
- Middleware protege rutas `/dashboard/*`

### Aislamiento de Datos
- RLS en todas las tablas
- Helpers automáticos aseguran `tenant_id` + `property_id`
- Validación en client y server

### Validaciones
- Formularios con validación de campos requeridos
- Confirmaciones para acciones destructivas
- Error boundaries para capturar errores UI

---

## 📱 PWA

- Manifest configurado
- Icons (192x192, 512x512)
- Service worker ready
- Instalable en iOS y Android
- Funcionalidad offline parcial

---

## 🧪 TESTING

### Manual
- Multi-tenant: Crear Tenant A y B, verificar aislamiento
- Multi-property: Crear 2 properties, cambiar entre ellas
- Flujos completos: Crear booking, expense, ticket, task

### Build
```bash
npm run build  # Debe compilar sin errores
npm run lint   # Sin warnings críticos
```

---

## 📝 NOTAS IMPORTANTES

### Convenciones de Código
- **Client Components:** `'use client'` al inicio
- **Server Components:** Por defecto (sin 'use client')
- **Queries:** Siempre usar helpers (`selectWithProperty`, etc.)
- **Eventos:** `propertyChanged` para refrescar cuando cambia propiedad
- **i18n:** NUNCA hardcodear texto en español, siempre usar `t()`

### Estado Actual
- ✅ Multi-tenant funcionando
- ✅ Multi-property funcionando
- ✅ Calendario unificado funcionando
- ✅ Plantillas de mantenimiento funcionando
- ✅ UI premium y responsive
- ✅ 100% en español
- ⏳ Billing básico (sin integración de pagos)
- ⏳ Roles avanzados (solo admin/staff básico)

### Próximos Pasos (Pendientes)
- SPRINT 3: Automatización inteligente (vencido + auto-ticket)
- SPRINT 4: Roles básicos (owner/admin/manager/staff/viewer)
- Integración de pagos (Stripe/PayPal)
- Notificaciones push
- Exportación avanzada (PDF, Excel)

---

## 🔧 COMANDOS ÚTILES

```bash
# Desarrollo
npm run dev              # Inicia servidor local
npm run build            # Build de producción
npm run lint             # Linter

# Scripts
npm run reset:data       # Reset de datos (solo dev)
npm run seed:data        # Seed de datos de ejemplo
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `README.md` - Setup básico
- `SUPABASE_BOOTSTRAP.sql` - Schema completo
- `CASAPILOT_TRANSFORMATION_PLAN.md` - Plan de transformación
- `MULTI_TENANT_MIGRATION.md` - Detalles de multi-tenant

---

## 🎯 PARA CHATGPT

**Contexto clave para entender el código:**
1. Es una app SaaS multi-tenant y multi-property
2. Usa Next.js 16 con App Router (server + client components)
3. Supabase como backend (Auth + DB + Storage)
4. Todo está en español (i18n centralizado)
5. Helpers automáticos para queries (tenant_id + property_id)
6. UI premium con Tailwind CSS
7. Calendario unificado muestra bookings + maintenance + tasks
8. Property context global (localStorage + eventos)
9. RLS en todas las tablas para seguridad
10. Componentes reutilizables en `components/ui/`

**Al hacer cambios:**
- Siempre usar helpers de queries
- Nunca hardcodear texto (usar `t()`)
- Respetar aislamiento tenant/property
- Seguir estructura de archivos existente
- Mantener UI premium y responsive

---

**Última actualización:** Febrero 2026
**Versión:** 0.1.0 (CasaPilot)

