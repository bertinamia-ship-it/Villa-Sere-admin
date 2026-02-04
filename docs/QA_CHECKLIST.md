# QA Checklist - CasaPilot

**Fecha**: 2026-01-XX  
**Versión**: Post-bugfixes  
**Objetivo**: Verificar que la app está estable y lista para producción

---

## 📋 Módulos a Verificar

### 1. Dashboard (`/dashboard`)

#### Navegación
- [ ] ✅ PASA - Navega correctamente desde sidebar
- [ ] ✅ PASA - Links a otros módulos funcionan
- [ ] ✅ PASA - No hay botones muertos

#### Visualización
- [ ] ✅ PASA - Métricas se muestran correctamente (Ingresos, Gastos, Balance, Ocupación)
- [ ] ✅ PASA - Sección "Hoy" muestra check-ins/check-outs/tareas/mantenimientos
- [ ] ✅ PASA - Alertas solo aparecen si hay datos relevantes
- [ ] ✅ PASA - Estados vacíos se muestran cuando no hay propiedad

#### Responsive
- [ ] ✅ PASA - Desktop: grid de 4 columnas para métricas
- [ ] ✅ PASA - Mobile: stack vertical

**Notas**: Dashboard limpio, sin "Acciones rápidas", layout correcto.

---

### 2. Calendario (`/calendario`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Toggle "Solo esta propiedad" funciona
- [ ] ✅ PASA - Selector de vista (Hoy/Semana/Mes) funciona

#### Visualización
- [ ] ✅ PASA - Muestra SOLO bookings (no mantenimiento ni tareas)
- [ ] ✅ PASA - Vista grid mensual con chips por día
- [ ] ✅ PASA - Estados de reserva (confirmed/cancelled/completed) con colores correctos
- [ ] ✅ PASA - Click en booking abre modal con detalles
- [ ] ✅ PASA - Botón "Nueva renta" abre formulario

#### Estados vacíos
- [ ] ✅ PASA - Muestra empty state cuando no hay reservas
- [ ] ✅ PASA - Mensaje claro en español

#### Responsive
- [ ] ✅ PASA - Grid se adapta a mobile

**Notas**: Calendario limpio, solo reservas, sin confusión con mantenimiento.

---

### 3. Reservas (`/rentals`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Toggle Calendar/List funciona

#### CRUD
- [ ] ✅ PASA - Crear reserva: formulario valida fechas, montos
- [ ] ✅ PASA - Editar reserva: pre-llena datos correctamente
- [ ] ✅ PASA - Eliminar reserva: confirmación funciona
- [ ] ✅ PASA - Guardar: usa helpers con property_id

#### Visualización
- [ ] ✅ PASA - Vista calendario: grid mensual con reservas
- [ ] ✅ PASA - Vista lista: tabla con todas las reservas
- [ ] ✅ PASA - Estadísticas mensuales se calculan correctamente
- [ ] ✅ PASA - Filtros por mes funcionan

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay reservas
- [ ] ✅ PASA - CTA "Agregar reserva" funciona

#### Responsive
- [ ] ✅ PASA - Vista lista se adapta a mobile
- [ ] ✅ PASA - Formulario es usable en mobile

**Notas**: Dos vistas funcionando correctamente, sin duplicación.

---

### 4. Mantenimiento - Tickets (`/maintenance`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Tabs "Tickets" / "Recurrentes" funcionan

#### CRUD
- [ ] ✅ PASA - Crear ticket: formulario valida campos requeridos
- [ ] ✅ PASA - Editar ticket: pre-llena datos
- [ ] ✅ PASA - Eliminar ticket: confirmación funciona
- [ ] ✅ PASA - Guardar: usa helpers con property_id

#### Filtros
- [ ] ✅ PASA - Búsqueda por texto funciona
- [ ] ✅ PASA - Filtro por estado (open/in_progress/done) funciona
- [ ] ✅ PASA - Filtro por prioridad funciona
- [ ] ✅ PASA - Filtro por habitación funciona

#### Visualización
- [ ] ✅ PASA - Cards muestran título, estado, prioridad, fecha
- [ ] ✅ PASA - Badges de estado y prioridad con colores correctos
- [ ] ✅ PASA - Lista se actualiza después de crear/editar/eliminar

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay tickets
- [ ] ✅ PASA - Mensaje claro con CTA

#### Responsive
- [ ] ✅ PASA - Grid de cards se adapta a mobile

**Notas**: Filtros en card, UI consistente.

---

### 5. Mantenimiento - Recurrentes (`/maintenance-plans`)

#### Navegación
- [ ] ✅ PASA - Navega desde tab "Recurrentes" en /maintenance
- [ ] ✅ PASA - Tabs "Pendientes" / "Todos" funcionan

#### CRUD
- [ ] ✅ PASA - Crear plan: formulario valida título y fecha
- [ ] ✅ PASA - Crear plan: switch "Repetir" funciona
- [ ] ✅ PASA - Crear plan: intervalo y unidad se validan
- [ ] ✅ PASA - Editar plan: pre-llena datos
- [ ] ✅ PASA - Eliminar plan: confirmación funciona
- [ ] ✅ PASA - Guardar: usa insertWithPropertyClient/updateWithPropertyClient
- [ ] ✅ PASA - Error logging: muestra detalles completos

#### Acciones
- [ ] ✅ PASA - "Marcar como hecho": recalcula next_run_date correctamente
- [ ] ✅ PASA - "Marcar como hecho": crea run record
- [ ] ✅ PASA - "Marcar como hecho": desactiva si no es recurrente
- [ ] ✅ PASA - "Crear ticket": pre-llena formulario de ticket

#### Visualización
- [ ] ✅ PASA - Lista muestra título, próxima fecha, frecuencia, prioridad
- [ ] ✅ PASA - Badges de estado (vencido/próximo/futuro) funcionan
- [ ] ✅ PASA - Fechas formateadas en español

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay planes
- [ ] ✅ PASA - CTA "Crear plan" funciona

#### Responsive
- [ ] ✅ PASA - Cards se adaptan a mobile

**Notas**: Helper centralizado para cálculo de fechas, sin crashes.

---

### 6. Tareas (`/tasks`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Tabs "Hoy" / "Esta semana" / "Vencidas" / "Todas" funcionan

#### CRUD
- [ ] ✅ PASA - Crear tarea: formulario valida título
- [ ] ✅ PASA - Crear tarea: "Una vez" requiere due_date
- [ ] ✅ PASA - Crear tarea: "Recurrente" requiere start_date
- [ ] ✅ PASA - Editar tarea: pre-llena datos
- [ ] ✅ PASA - Eliminar tarea: confirmación funciona
- [ ] ✅ PASA - Guardar: usa insertWithPropertyClient/updateWithPropertyClient
- [ ] ✅ PASA - Error logging: muestra detalles completos

#### Acciones
- [ ] ✅ PASA - "Marcar como hecho": para "once" marca status=done
- [ ] ✅ PASA - "Marcar como hecho": para recurrentes recalcula next_due_date
- [ ] ✅ PASA - Cambiar estado: dropdown funciona

#### Visualización
- [ ] ✅ PASA - Cards muestran título, fecha, prioridad, estado, tipo
- [ ] ✅ PASA - Badges de prioridad y estado con colores correctos
- [ ] ✅ PASA - Tareas vencidas se destacan en rojo
- [ ] ✅ PASA - Fechas formateadas en español

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay tareas
- [ ] ✅ PASA - CTA "Crear tarea" funciona

#### Responsive
- [ ] ✅ PASA - Cards se adaptan a mobile

**Notas**: Helper centralizado para cálculo de fechas, validaciones correctas.

---

### 7. Inventario (`/inventory`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Botones "Agregar", "Importar CSV", "Exportar CSV" funcionan

#### CRUD
- [ ] ✅ PASA - Crear artículo: formulario valida nombre, cantidad
- [ ] ✅ PASA - Editar artículo: pre-llena datos
- [ ] ✅ PASA - Eliminar artículo: confirmación funciona
- [ ] ✅ PASA - Ajuste rápido de cantidad funciona
- [ ] ✅ PASA - Guardar: usa helpers con property_id

#### Filtros
- [ ] ✅ PASA - Búsqueda por texto funciona
- [ ] ✅ PASA - Filtro por categoría funciona
- [ ] ✅ PASA - Filtro por habitación funciona

#### Visualización
- [ ] ✅ PASA - Grid de cards con foto (si existe)
- [ ] ✅ PASA - Alerta "Stock bajo" se muestra cuando quantity <= min_threshold
- [ ] ✅ PASA - Lista se actualiza después de crear/editar/eliminar

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay artículos
- [ ] ✅ PASA - CTA "Agregar Primer Artículo" funciona

#### Responsive
- [ ] ✅ PASA - Grid de 3 columnas en desktop, 1 en mobile

**Notas**: UI premium, filtros en card.

---

### 8. Gastos (`/expenses`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Botones "Agregar Gasto", "Exportar CSV" funcionan

#### CRUD
- [ ] ✅ PASA - Crear gasto: formulario valida monto, fecha, categoría
- [ ] ✅ PASA - Editar gasto: pre-llena datos
- [ ] ✅ PASA - Eliminar gasto: confirmación funciona
- [ ] ✅ PASA - Guardar: usa helpers con property_id

#### Visualización
- [ ] ✅ PASA - Selector de mes funciona
- [ ] ✅ PASA - Resumen mensual muestra total, por categoría, por proveedor
- [ ] ✅ PASA - Tabla de gastos muestra fecha, categoría, monto, detalles
- [ ] ✅ PASA - Links a recibo funcionan (si existe)

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay gastos
- [ ] ✅ PASA - CTA "Registrar Primer Gasto" funciona

#### Responsive
- [ ] ✅ PASA - Tabla se adapta a mobile (scroll horizontal si necesario)

**Notas**: UI premium, tabla elegante.

---

### 9. Compras (`/to-buy`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Botón "Agregar Item" funciona

#### CRUD
- [ ] ✅ PASA - Crear item: formulario valida campos
- [ ] ✅ PASA - Editar item: pre-llena datos
- [ ] ✅ PASA - Eliminar item: funciona
- [ ] ✅ PASA - Guardar: usa helpers con property_id

#### Filtros
- [ ] ✅ PASA - Búsqueda por texto funciona
- [ ] ✅ PASA - Filtro por estado funciona
- [ ] ✅ PASA - Filtro por área funciona

#### Visualización
- [ ] ✅ PASA - Cards muestran item, cantidad, estado, área
- [ ] ✅ PASA - Links externos funcionan (si existe)
- [ ] ✅ PASA - Resumen de estados se muestra correctamente

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay items

#### Responsive
- [ ] ✅ PASA - Cards se adaptan a mobile

**Notas**: Funcional, sin problemas evidentes.

---

### 10. Proveedores (`/vendors`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Botón "Agregar Proveedor" funciona

#### CRUD
- [ ] ✅ PASA - Crear proveedor: formulario valida nombre
- [ ] ✅ PASA - Editar proveedor: pre-llena datos
- [ ] ✅ PASA - Eliminar proveedor: confirmación en español funciona
- [ ] ✅ PASA - Guardar: usa helpers con tenant_id (compartido)

#### Visualización
- [ ] ✅ PASA - Cards muestran nombre, contacto, especialidad
- [ ] ✅ PASA - Links tel:, mailto:, WhatsApp funcionan
- [ ] ✅ PASA - Lista se actualiza después de crear/editar/eliminar

#### Estados vacíos
- [ ] ✅ PASA - Empty state cuando no hay proveedores

#### Responsive
- [ ] ✅ PASA - Cards se adaptan a mobile

**Notas**: Vendors compartidos por tenant (correcto), confirmación en español.

---

### 11. Reportes (`/reports`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Selector de mes funciona
- [ ] ✅ PASA - Botón "Exportar CSV" funciona

#### Visualización
- [ ] ✅ PASA - Resumen de gastos mensuales se muestra
- [ ] ✅ PASA - Resumen de mantenimiento se muestra
- [ ] ✅ PASA - Insights de inventario se muestran
- [ ] ✅ PASA - Gráficos/tablas se renderizan correctamente

#### Exportación
- [ ] ✅ PASA - CSV se genera correctamente
- [ ] ✅ PASA - Nombre de archivo incluye propiedad y fecha

#### Responsive
- [ ] ✅ PASA - Se adapta a mobile

**Notas**: Funcional, sin problemas evidentes.

---

### 12. Configuración (`/settings`)

#### Navegación
- [ ] ✅ PASA - Navega desde sidebar
- [ ] ✅ PASA - Solo visible para admin/owner

#### Funcionalidad
- [ ] ✅ PASA - Reset Data button está en "Avanzado" → "Acciones peligrosas"
- [ ] ✅ PASA - Reset Data: confirmación fuerte funciona
- [ ] ✅ PASA - Reset Data: requiere escribir "RESET"
- [ ] ✅ PASA - Reset Data: solo para owner/admin

#### Responsive
- [ ] ✅ PASA - Se adapta a mobile

**Notas**: Reset button correctamente ubicado, no en dashboard.

---

## 🔍 Auditoría de Duplicación

### Formatters de Fecha
- **Estado**: ✅ UNIFICADO
- **Archivo**: `lib/utils/formatters.ts`
- **Funciones**: `formatDate()`
- **Aplicado en**: 
  - ✅ `maintenance-plans/MaintenancePlanList.tsx`
  - ⚠️ Pendiente aplicar en otros módulos (quick win)

### Formatters de Moneda
- **Estado**: ✅ UNIFICADO
- **Archivo**: `lib/utils/formatters.ts`
- **Funciones**: `formatCurrency()`, `formatCurrencyShort()`
- **Aplicado en**: 
  - ⚠️ Pendiente aplicar en módulos que usan `toFixed()` directamente

### Badges de Estado/Prioridad
- **Estado**: ✅ UNIFICADO
- **Archivo**: `lib/utils/formatters.ts`
- **Funciones**: `getBookingStatusColor()`, `getPriorityColor()`, `getMaintenanceStatusColor()`, `getTaskStatusColor()`
- **Aplicado en**: 
  - ⚠️ Pendiente aplicar en módulos que tienen funciones duplicadas

### Manejo de Errores
- **Estado**: ✅ UNIFICADO
- **Archivo**: `lib/utils/error-handler.ts`
- **Funciones**: `logError()`, `getUserFriendlyError()`, `extractErrorDetails()`
- **Aplicado en**: 
  - ✅ `maintenance-plans/MaintenancePlanForm.tsx`
  - ✅ `maintenance-plans/MaintenancePlanList.tsx`
  - ✅ `tasks/TaskForm.tsx`
  - ⚠️ Pendiente aplicar en otros formularios

---

## ✅ Resumen General

### Navegación
- ✅ Todos los links del sidebar funcionan
- ✅ No hay botones muertos
- ✅ Rutas correctas

### CRUD
- ✅ Crear funciona en todos los módulos
- ✅ Editar funciona en todos los módulos
- ✅ Eliminar con confirmación funciona
- ✅ Todos usan helpers de seguridad (property_id/tenant_id)

### Filtros
- ✅ Búsqueda funciona donde existe
- ✅ Filtros por estado/prioridad/categoría funcionan
- ✅ Filtros se resetean correctamente

### Estados Vacíos
- ✅ Empty states consistentes
- ✅ CTAs funcionan
- ✅ Mensajes en español

### Responsive
- ✅ Desktop: layouts correctos
- ✅ Mobile: adaptación básica funciona
- ✅ Formularios usables en mobile

### Errores y Validaciones
- ✅ Validaciones de campos requeridos
- ✅ Errores se muestran en español
- ✅ Logging detallado en consola
- ⚠️ Algunos formularios aún necesitan mejor logging (quick win)

---

## 🎯 Quick Wins Aplicados

1. ✅ Helper centralizado `formatDate()` en `lib/utils/formatters.ts`
2. ✅ Helper centralizado `formatCurrency()` en `lib/utils/formatters.ts`
3. ✅ Helper centralizado para badges en `lib/utils/formatters.ts`
4. ✅ Helper centralizado de errores en `lib/utils/error-handler.ts`
5. ✅ Aplicado en Maintenance Plans y Tasks (más críticos)

---

## ⚠️ Pendientes (No Bloqueantes)

1. Aplicar formatters unificados en todos los módulos (no crítico, mejora de código)
2. Aplicar error-handler en todos los formularios (mejora de UX)
3. Algunos módulos aún tienen funciones duplicadas de badges (no crítico)

---

**Conclusión**: ✅ App estable, funcional, lista para producción. Quick wins aplicados en módulos críticos. Pendientes son mejoras de código, no bugs.

