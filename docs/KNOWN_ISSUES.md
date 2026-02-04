# Known Issues - CasaPilot

**Última actualización**: 2026-01-XX  
**Estado**: App funcional, issues son mejoras o dependencias externas

---

## 🔴 Críticos (Bloqueantes para Producción)

**Ninguno** - La app es funcional y estable.

---

## 🟡 Medios (Mejoras Importantes)

### 1. Aplicar Helpers Unificados en Todos los Módulos

**Severidad**: Media  
**Tipo**: Mejora de código / Consistencia  
**Estado**: Parcialmente aplicado

**Descripción**:
- Helpers unificados creados en `lib/utils/formatters.ts` y `lib/utils/error-handler.ts`
- Aplicados en Maintenance Plans y Tasks (módulos críticos)
- Pendiente aplicar en: Rentals, Inventory, Expenses, Maintenance Tickets, To-Buy, Vendors

**Impacto**:
- Código más mantenible
- Consistencia visual
- Mejor UX en manejo de errores

**Solución**:
- Reemplazar funciones duplicadas por helpers unificados
- Testing después de cambios

**Estimado**: 2-3 horas

---

### 2. Mejorar Logging de Errores en Formularios Restantes

**Severidad**: Media  
**Tipo**: Mejora de UX / Debugging  
**Estado**: Parcialmente aplicado

**Descripción**:
- `error-handler.ts` creado y aplicado en Maintenance Plans y Tasks
- Pendiente aplicar en: Rentals/BookingForm, Inventory/InventoryForm, Expenses/ExpenseForm, Maintenance/TicketForm, To-Buy/PurchaseItemForm, Vendors/VendorForm

**Impacto**:
- Mejor debugging cuando hay errores
- Mensajes de error más claros para el usuario
- Evita "Error: {}" genéricos

**Solución**:
- Usar `logError()` y `getUserFriendlyError()` en todos los catch blocks
- Testing de errores intencionales

**Estimado**: 1-2 horas

---

## 🟢 Bajos (Mejoras Opcionales)

### 3. Paginación o "Load More" para Listas Grandes

**Severidad**: Baja  
**Tipo**: Performance / UX  
**Estado**: No implementado

**Descripción**:
- Listas grandes (100+ items) pueden ser lentas
- No hay paginación ni "cargar más"

**Impacto**:
- Performance en propiedades con muchos datos
- UX mejoraría con paginación

**Solución**:
- Implementar paginación o infinite scroll
- Limitar queries iniciales a 50 items

**Estimado**: 4-6 horas

**Nota**: No crítico para MVP, puede agregarse después.

---

### 4. Validación de Overlaps en Reservas

**Severidad**: Baja  
**Tipo**: Validación de negocio  
**Estado**: Implementado parcialmente

**Descripción**:
- Validación de overlaps existe pero podría ser más robusta
- No valida overlaps al editar reserva existente

**Impacto**:
- Posibilidad de crear reservas que se solapan (raro pero posible)

**Solución**:
- Mejorar validación en BookingForm
- Validar al editar también

**Estimado**: 2-3 horas

**Nota**: Funcionalidad básica funciona, esto es mejora.

---

## 🔵 Dependencias Externas

### 5. Integración de Pagos (Stripe/PayPal)

**Severidad**: N/A (Feature Request)  
**Tipo**: Billing  
**Estado**: No implementado

**Descripción**:
- DB y UI listos para billing
- Falta integración real con Stripe/PayPal

**Impacto**:
- No se pueden procesar pagos reales
- Trial funciona, pero no hay upgrade path

**Solución**:
- Integrar Stripe Checkout o PayPal
- Webhooks para actualizar subscription_status

**Estimado**: 8-12 horas

**Nota**: Feature request, no bug. App funciona sin esto.

---

### 6. Funciones SQL en Supabase (Opcional)

**Severidad**: N/A (Optimización)  
**Tipo**: Performance  
**Estado**: No implementado

**Descripción**:
- Cálculo de fechas se hace en cliente
- Podría optimizarse con funciones SQL en Supabase

**Impacto**:
- Performance ligeramente mejor
- Cálculos más precisos (timezone)

**Solución**:
- Crear funciones `calculate_next_due_date()` y `calculate_next_run_date()` en Supabase
- Usar `.rpc()` en lugar de helpers de cliente

**Estimado**: 2-3 horas (SQL + testing)

**Nota**: Helpers de cliente funcionan correctamente. Esto es optimización opcional.

---

## 📝 Notas de Implementación

### Helpers Unificados

**Archivos creados**:
- `lib/utils/formatters.ts` - Formatters de fecha, moneda, badges
- `lib/utils/error-handler.ts` - Manejo centralizado de errores

**Aplicado en**:
- ✅ `maintenance-plans/MaintenancePlanForm.tsx`
- ✅ `maintenance-plans/MaintenancePlanList.tsx`
- ✅ `tasks/TaskForm.tsx`
- ✅ `tasks/TaskList.tsx`

**Pendiente aplicar en**:
- ⚠️ `rentals/BookingForm.tsx`
- ⚠️ `inventory/InventoryForm.tsx`
- ⚠️ `expenses/ExpenseForm.tsx`
- ⚠️ `maintenance/TicketForm.tsx`
- ⚠️ `to-buy/PurchaseItemForm.tsx`
- ⚠️ `vendors/VendorForm.tsx`

---

## ✅ Resumen

- **Críticos**: 0
- **Medios**: 2 (mejoras de código, no bugs)
- **Bajos**: 2 (optimizaciones opcionales)
- **Dependencias**: 2 (features/optimizaciones)

**Conclusión**: App estable y funcional. Issues pendientes son mejoras, no bugs bloqueantes.


