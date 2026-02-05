# ✅ QA Checklist - App Store Style

**Fecha:** 2026-02-05  
**Versión:** Production Ready  
**Backup:** `backup/production-ready-2026-02-05` (tag: `production-ready-2026-02-05`)

---

## 📱 PARTE 1: Backups

- [x] **Backup creado en Git**
  - Branch: `backup/production-ready-2026-02-05`
  - Tag: `production-ready-2026-02-05`
  - Estado: Creado localmente (push pendiente cuando haya red)

---

## 🐛 PARTE 2: Bug Sweep (Funcional)

### Login
- [x] **Desktop:** Login funcional, diseño limpio
- [x] **Móvil:** Botón con `min-h-[44px]`, safe areas aplicadas
- [x] **Sign Up:** Funcional, validación correcta
- [x] **Errores:** Mensajes claros en español

### Dashboard
- [x] **Carga correcta:** Datos se muestran correctamente
- [x] **Métricas:** Ingresos, gastos, balance, inventario
- [x] **Hoy:** Check-ins, check-outs, tareas, mantenimiento
- [x] **Alertas:** Tareas vencidas, stock bajo, tickets urgentes
- [x] **Property Header:** Se actualiza dinámicamente al cambiar propiedad

### Cambiar Propiedad
- [x] **Desktop:** Selector funcional en header
- [x] **Móvil:** Selector accesible en drawer (primer elemento)
- [x] **Actualización:** Header y dashboard se actualizan automáticamente
- [x] **Eliminar propiedad:** Funcional con confirmación

### Reservas (Rentals)
- [x] **Calendario:** Vista mensual funcional
- [x] **Lista:** Vista de lista funcional
- [x] **CRUD:** Crear, editar, eliminar reservas
- [x] **Móvil:** Calendario legible, chips no saturados

### Banco
- [x] **Cuentas:** Lista de cuentas funcional
- [x] **Movimientos:** Tabla desktop + cards móvil
- [x] **Gasto descuenta:** Funcional desde cuenta
- [x] **Editar/Borrar revierte:** Funcional con confirmación
- [x] **Móvil:** Cards con botones accesibles (min-h-[44px])

### Gastos (Expenses)
- [x] **CRUD:** Crear, editar, eliminar gastos
- [x] **Export:** Exportar CSV funcional
- [x] **Filtro mensual:** Funcional
- [x] **Móvil:** Cards con formato consistente
- [x] **Formatters:** Usa `formatDate` centralizado

### Mantenimiento
- [x] **Tickets CRUD:** Crear, editar, eliminar tickets
- [x] **Recurrentes:** Planes de mantenimiento funcionales
- [x] **Filtros:** Por estado, prioridad, habitación
- [x] **Móvil:** Cards funcionales

### Tareas (Tasks)
- [x] **CRUD:** Crear, editar, eliminar tareas
- [x] **Recurrentes:** Tareas recurrentes funcionales
- [x] **Estados:** Pending, in_progress, done
- [x] **Móvil:** Lista funcional

### Inventario
- [x] **CRUD:** Crear, editar, eliminar items
- [x] **Import/Export:** CSV funcional
- [x] **Ajuste rápido:** Funcional
- [x] **Stock bajo:** Alertas funcionan

### To-Buy
- [x] **CRUD:** Crear, editar, eliminar items
- [x] **Estados:** Funcionales
- [x] **Filtros:** Por estado y área

### Vendors
- [x] **CRUD:** Crear, editar, eliminar proveedores
- [x] **Asociación:** Con gastos y tickets

### Reportes
- [x] **Resumen mensual:** Funcional
- [x] **Gastos por categoría:** Funcional
- [x] **Mantenimiento:** Totales funcionales
- [x] **Inventario:** Insights funcionales
- [x] **Bloque Banco:** Funcional

### Settings
- [x] **PWA Install:** Sección visible y funcional
- [x] **Reset en avanzado:** Funcional (solo admin)

---

## 📱 PARTE 3: Mobile Perfect

### Safe Areas
- [x] **iOS Notch:** `safe-area-top`, `safe-area-bottom` aplicados
- [x] **Dynamic Island:** Compatible
- [x] **Android Navigation:** Safe areas aplicadas
- [x] **CSS:** `env(safe-area-inset-*)` en `globals.css`

### Header/Hamburger
- [x] **Botón hamburger:** `min-w-[48px] min-h-[48px]` (accesible)
- [x] **Posición:** Fixed top, safe-area aplicado
- [x] **Drawer:** Overlay + animación suave
- [x] **Cerrar:** ESC (desktop) + tap fuera (móvil)

### Selector de Propiedad (Móvil)
- [x] **Ubicación:** Primer elemento en drawer
- [x] **Accesible:** Sin scroll raro, fácil de tocar
- [x] **Estilo:** Premium, consistente con desktop

### Tablas → Cards
- [x] **Gastos:** Cards móvil funcionales
- [x] **Banco:** Cards móvil funcionales
- [x] **Inventario:** Cards móvil funcionales
- [x] **Botones:** `min-h-[44px]` en todos los botones móvil

### Modals
- [x] **Full-screen móvil:** Modals se adaptan
- [x] **Scroll interno:** Funcional
- [x] **Botones visibles:** No se cortan
- [x] **Cerrar fácil:** X visible y accesible

### Formularios
- [x] **Inputs:** `min-h-[44px]` en móvil, `text-base` (16px) para evitar zoom iOS
- [x] **Labels:** Claros y visibles
- [x] **Espaciado:** Cómodo vertical
- [x] **Teclado iOS:** No tapa botones (sticky bottom si necesario)

### Tipografía y Espaciado
- [x] **Headers:** Compactos en móvil
- [x] **Cards:** Padding adecuado
- [x] **Texto:** No demasiado largo, truncado cuando necesario

### Consistencia Visual
- [x] **Colores:** Móvil = Desktop
- [x] **Animaciones:** Suaves y consistentes
- [x] **Estilo:** Premium en ambos

---

## 🎨 PARTE 4: Icono PWA y Assets

### Iconos
- [x] **icon-192.png:** Existe en `/public`, sin bordes
- [x] **icon-512.png:** Existe en `/public`, sin bordes
- [x] **apple-touch-icon.png:** Existe en `/public` (180x180), sin bordes

### Manifest
- [x] **manifest.json:** Configurado correctamente
- [x] **Versiones:** `?v=4` en todas las referencias
- [x] **Theme color:** `#1e293b` (slate-800)
- [x] **Background color:** `#0f172a` (slate-900)

### Layout Metadata
- [x] **app/layout.tsx:** Iconos apuntan correctamente
- [x] **Versiones consistentes:** `?v=4` en metadata y head
- [x] **Apple Web App:** Configurado correctamente

### Splash/Hero
- [x] **Login:** Sin splash (limpio y rápido)
- [x] **Dashboard:** Property header compacto (no hero grande)

### Documentación
- [x] **docs/REINSTALL_PWA.md:** Instrucciones para reinstalar PWA y ver icono nuevo

---

## 🧹 PARTE 5: Limpieza y Deduplicación

### Formatters Centralizados
- [x] **formatDate:** Usado en ExpenseList (reemplazado `toLocaleDateString`)
- [x] **formatCurrency:** Disponible en formatters.ts
- [x] **Badges:** Funciones centralizadas en formatters.ts

### Archivos No Usados
- [ ] **Pendiente:** Revisar archivos temporales y docs obsoletos (conservador)

### Duplicación
- [x] **Fechas:** Centralizado en `formatDate`
- [x] **Moneda:** Centralizado en `formatCurrency`
- [x] **Badges:** Centralizados en formatters.ts

---

## ✅ PARTE 6: Checklist Final

### Build
- [x] **Compilación:** Sin errores
- [x] **TypeScript:** Sin errores de tipo
- [x] **Lint:** Sin errores críticos

### Funcionalidades
- [x] **Login:** PASS
- [x] **Dashboard:** PASS
- [x] **Cambiar propiedad:** PASS
- [x] **Reservas:** PASS
- [x] **Banco:** PASS
- [x] **Gastos:** PASS
- [x] **Mantenimiento:** PASS
- [x] **Tareas:** PASS
- [x] **Inventario:** PASS
- [x] **To-Buy:** PASS
- [x] **Vendors:** PASS
- [x] **Reportes:** PASS
- [x] **Settings:** PASS

### Mobile
- [x] **Safe areas:** PASS
- [x] **Header/Hamburger:** PASS
- [x] **Selector propiedad:** PASS
- [x] **Tablas → Cards:** PASS
- [x] **Modals:** PASS
- [x] **Formularios:** PASS
- [x] **Consistencia visual:** PASS

### PWA
- [x] **Iconos:** PASS
- [x] **Manifest:** PASS
- [x] **Metadata:** PASS
- [x] **Instalable:** PASS

---

## 🚀 Deploy

### Pre-Deploy
- [x] **Backup creado:** `backup/production-ready-2026-02-05`
- [x] **Build exitoso:** Sin errores
- [x] **Lint limpio:** Sin errores críticos

### Post-Deploy
- [ ] **Verificar en Vercel:** App carga correctamente
- [ ] **PWA instalable:** Icono correcto aparece
- [ ] **Mobile test:** iPhone y Android funcionan correctamente

---

## 📝 Notas

- **Icono PWA:** Para ver el icono nuevo en iOS, es necesario reinstalar la PWA (ver `docs/REINSTALL_PWA.md`)
- **Backup:** El backup está creado localmente. Push a GitHub pendiente cuando haya red.
- **Formatters:** Se unificó el uso de `formatDate` en ExpenseList para evitar duplicación.
- **Mobile:** Todos los botones tienen `min-h-[44px]` o `min-h-[48px]` para accesibilidad táctil.

---

**Estado Final:** ✅ **READY FOR PRODUCTION**

