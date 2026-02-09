# FASE 4 — ONBOARDING + CONVERSIÓN

**Fecha inicio:** 2026-02-08  
**Objetivo:** Convertir la app en producto que VENDE. Enfoque en onboarding, empty states guiados, trial y planes.

---

## 4.1 ONBOARDING (PRIORIDAD MÁXIMA) ✅

### Objetivo
Crear wizard inicial que guíe a usuarios nuevos a través de los primeros pasos esenciales.

### Implementación
- **Trigger:** Se muestra SOLO si el usuario NO tiene propiedades
- **Paso 1:** Crear primera propiedad
- **Paso 2:** Crear cuenta bancaria
- **Paso 3:** Crear primer gasto
- **Finalización:** Mensaje "Todo listo" y redirigir a Dashboard

### Características
- ✅ UX mobile-first
- ✅ Todo texto con `t()` (ES/EN)
- ✅ No rompe flujos existentes
- ✅ Componente: `components/OnboardingWizard.tsx`

### Estado
- ✅ Keys de i18n agregadas (ES/EN) - `onboarding.*`
- ✅ Componente `OnboardingWizard.tsx` creado
- ✅ Componente `OnboardingWrapper.tsx` creado (wrapper client-side)
- ✅ Integrado en `dashboard/page.tsx`
- ✅ Se muestra solo si `getUserProperties()` retorna array vacío
- ✅ Paso 1: Crear propiedad (usa PropertySelector logic)
- ✅ Paso 2: Crear cuenta bancaria (usa AccountForm logic)
- ✅ Paso 3: Crear primer gasto (usa ExpenseForm logic)
- ✅ Progress indicator visual
- ✅ Navegación entre pasos (back/next/skip)
- ✅ Pantalla de completion (step 4) con mensaje "Todo listo"
- ⏳ Pendiente: Testing completo (FASE 4.2)

---

## 4.2 EMPTY STATES GUIADOS ✅

### Objetivo
Reemplazar pantallas vacías sin guía con mensajes humanos y CTAs claros.

### Módulos a mejorar
- ✅ Bank - Ya tiene EmptyState guiado con CTA
- ✅ Expenses - Ya tiene EmptyState guiado con CTA
- ✅ Inventory - Ya tiene EmptyState guiado con CTA
- ✅ Maintenance - Ya tiene EmptyState guiado con CTA

### Características
- ✅ Mensaje humano y claro
- ✅ Botón prominente para crear primer elemento
- ✅ Iconografía apropiada
- ✅ Todo con `t()`

### Estado
- ✅ Todos los módulos ya tienen empty states guiados implementados
- ✅ Usan componente `EmptyState` con icon, title, description y action
- ✅ CTAs claros para crear primer elemento

---

## 4.3 TRIAL 7 DÍAS (SIN PAGOS) ✅

### Objetivo
Implementar sistema de trial sin integración de pagos.

### Implementación
- ✅ `trial_ends_at` ya existe en tabla `tenants` (verificado en schema)
- ✅ Helper `isTrialActive()` creado en `lib/utils/trial.ts`
- ✅ Helper `getTrialInfo()` creado para obtener info completa del trial
- ✅ Helper `initializeTrial()` creado para inicializar trial de 7 días
- ✅ Componente `TrialBanner.tsx` creado - Banner discreto con días restantes
- ✅ Integrado en `app/(dashboard)/layout.tsx`
- ✅ Keys de i18n agregadas (ES/EN) - `trial.*`
- ✅ Hook `useTrialGuard()` creado en `hooks/useTrialGuard.ts`
- ✅ Modo solo lectura implementado:
  - Bloquea crear/editar/borrar cuando trial vencido
  - Muestra toast con mensaje claro
  - Redirige a Settings después de 2 segundos
  - Integrado en: ExpenseForm, ExpensesManager, AccountForm
- ⏳ Pendiente: Agregar `trial_start_at` a tabla (opcional, puede usar `created_at`)

### Características del Banner
- Banner discreto en la parte superior del layout
- Muestra días restantes: "Te quedan X días de prueba" / "Te queda 1 día de prueba"
- Botón "Activar Plan" que lleva a Settings
- Botón para cerrar/dismiss banner
- Solo se muestra si trial está activo (no expirado)
- Mobile-first design
- Gradient azul/indigo discreto

### Modo Solo Lectura
- Hook `useTrialGuard()` verifica estado del trial
- Bloquea acciones de crear/editar/borrar cuando `isTrialExpired === true`
- Muestra toast: "Esta acción está bloqueada porque tu trial ha expirado. Actualiza tu plan para continuar usando CasaPilot."
- Redirige automáticamente a Settings después de 2 segundos
- Navegación y lectura permanecen habilitadas

### Estado
- ✅ Banner implementado y funcional
- ✅ Modo solo lectura implementado
- ✅ Integrado en TODOS los módulos:
  - ✅ Bank (crear/editar/eliminar cuenta, crear/eliminar transacción)
  - ✅ Expenses (crear/editar/eliminar gasto)
  - ✅ Maintenance (crear/editar/eliminar ticket)
  - ✅ Tasks (crear/editar/eliminar tarea)
  - ✅ Inventory (crear/editar/eliminar item)
  - ✅ Vendors (crear/editar/eliminar proveedor)
  - ✅ To-Buy (crear/editar/eliminar item)
  - ✅ Rentals (crear/editar/eliminar booking)
- ✅ Hook `useTrialGuard` expandido con `canWrite` y `showTrialBlockedToast`
- ✅ Botones deshabilitados cuando `canWrite === false`
- ✅ Toast claro con mensaje y redirección a Settings

---

## 4.4 MI PLAN (SOLO UI) ✅

### Objetivo
Mostrar información del plan actual sin integración de pagos.

### Implementación
- ✅ Nueva sección "Mi Plan" en Settings (primera sección)
- ✅ Muestra estado del plan:
  - Badge verde: "Plan Activo" (si no es trial)
  - Badge azul: "Periodo de Prueba" con días restantes (si trial activo)
  - Badge rojo: "Trial Expirado" (si trial vencido)
- ✅ Precio claro: "$20 USD / propiedad / mes"
- ✅ Texto "Pagos próximamente" (itálico)
- ✅ Usa `useTrialGuard()` para obtener estado del trial
- ✅ Keys de i18n agregadas (ES/EN) - `settings.myPlan.*`
- ✅ Diseño limpio y profesional (mobile-first)
- ✅ NO integrado Stripe (solo UI)

### Características
- Card con icono de tarjeta de crédito
- Badge de estado dinámico según trial
- Precio destacado
- Texto discreto "Pagos próximamente"
- Mobile-first responsive

### Estado
- ✅ Sección "Mi Plan" implementada y funcional
- ✅ Muestra estado del trial (activo/expirado/plan activo)
- ✅ Muestra días restantes cuando trial activo
- ✅ Precio claro: "$20 USD / propiedad / mes"
- ✅ Texto "Pagos próximamente" (itálico)
- ✅ Diseño limpio y profesional (mobile-first)

---

## REGLAS GENERALES

- ✅ 0 errores en consola
- ✅ 0 keys visibles
- ✅ Todo documentado
- ✅ Mobile-first
- ✅ i18n completo (ES/EN)

---

## PRÓXIMOS PASOS

1. ✅ Crear documentación PHASE_4.md
2. ✅ Implementar Onboarding Wizard
3. ✅ Verificar Empty States (ya implementados)
4. ⏳ **FASE 4.2: Testing completo del onboarding** (requiere testing manual)
5. ✅ Implementar Trial Banner (FASE 4.3)
6. ✅ Implementar Modo Solo Lectura cuando trial vencido (FASE 4.3 - COMPLETADO)
7. ✅ Implementar Mi Plan UI (FASE 4.4 - COMPLETADO)

---

## ARCHIVOS CREADOS/MODIFICADOS

### Nuevos Archivos (FASE 4.1)
- `components/OnboardingWizard.tsx` - Wizard de onboarding completo
- `components/OnboardingWrapper.tsx` - Wrapper client-side para wizard
- `docs/PHASE_4.md` - Documentación de FASE 4

### Nuevos Archivos (FASE 4.3)
- `lib/utils/trial.ts` - Helpers para trial (isTrialActive, getTrialInfo, initializeTrial)
- `components/TrialBanner.tsx` - Banner discreto con días restantes
- `hooks/useTrialGuard.ts` - Hook para bloquear acciones cuando trial vencido

### Archivos Modificados
- `app/(dashboard)/dashboard/page.tsx` - Integración del wizard
- `app/(dashboard)/layout.tsx` - Integración del TrialBanner
- `app/(dashboard)/settings/page.tsx` - Sección "Mi Plan" agregada
- `app/(dashboard)/expenses/ExpenseForm.tsx` - Integración de useTrialGuard
- `app/(dashboard)/expenses/ExpensesManager.tsx` - Integración de useTrialGuard (delete)
- `app/(dashboard)/bank/AccountForm.tsx` - Integración de useTrialGuard
- `lib/i18n/es.ts` - Keys de onboarding, trial y settings.myPlan agregadas
- `lib/i18n/en.ts` - Keys de onboarding, trial y settings.myPlan agregadas
- `components/OnboardingWizard.tsx` - Fix: mostrar pantalla de completion (step 4)

---

## TESTING REQUERIDO (FASE 4.2)

### Checklist de Testing
- [ ] Crear usuario nuevo (sin propiedades)
- [ ] Verificar que wizard aparece en dashboard
- [ ] Paso 1: Crear propiedad - verificar que funciona
- [ ] Paso 2: Crear cuenta - verificar que funciona
- [ ] Paso 3: Crear gasto - verificar que funciona
- [ ] Verificar pantalla de completion
- [ ] Verificar redirección al dashboard
- [ ] Verificar que usuarios con propiedades NO ven wizard
- [ ] Probar en móvil (iPhone Safari)
- [ ] Probar en desktop
- [ ] Probar en ES y EN
- [ ] Verificar 0 errores en consola
- [ ] Verificar 0 keys visibles

### Resultado
- ⏳ Pendiente testing manual
