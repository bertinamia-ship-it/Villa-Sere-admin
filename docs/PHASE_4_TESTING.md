# FASE 4.2 — TESTING MANUAL (Usuario Nuevo)

**Fecha:** 2026-02-08  
**Objetivo:** Verificar que el onboarding funciona correctamente para usuarios nuevos

---

## Checklist de Testing

### Pre-requisitos
- [ ] Base de datos limpia o usuario nuevo sin propiedades
- [ ] Navegador en modo incógnito (o limpiar localStorage/cookies)
- [ ] DevTools Console abierta

---

## 1. ONBOARDING WIZARD

### 1.1 Aparece correctamente
- [ ] Usuario nuevo (sin propiedades) ve el wizard al entrar a `/dashboard`
- [ ] Usuario existente (con propiedades) NO ve el wizard
- [ ] El wizard muestra: "¡Bienvenido a CasaPilot!" con descripción

### 1.2 Paso 1: Crear Propiedad
- [ ] Formulario muestra campos: Nombre y Ubicación (opcional)
- [ ] Validación: Nombre requerido
- [ ] Al crear:
  - [ ] Se crea registro en tabla `properties`
  - [ ] `activePropertyId` se setea en localStorage
  - [ ] Toast de éxito: "Propiedad creada exitosamente"
  - [ ] Avanza al Paso 2

### 1.3 Paso 2: Crear Cuenta Bancaria
- [ ] Formulario muestra: Nombre, Tipo, Saldo inicial
- [ ] Validación: Nombre requerido, saldo >= 0
- [ ] Al crear:
  - [ ] Se crea registro en tabla `financial_accounts`
  - [ ] `property_id` está correctamente asociado
  - [ ] Toast de éxito: "Cuenta creada exitosamente"
  - [ ] Avanza al Paso 3

### 1.4 Paso 3: Crear Primer Gasto
- [ ] Formulario muestra: Fecha, Monto, Categoría
- [ ] Validación: Monto > 0, categoría requerida
- [ ] Al crear:
  - [ ] Se crea registro en tabla `expenses`
  - [ ] `property_id` y `account_id` están correctamente asociados
  - [ ] Toast de éxito: "Gasto registrado exitosamente"
  - [ ] Avanza al Paso 4 (completion)

### 1.5 Paso 4: Completion
- [ ] Muestra mensaje: "¡Todo listo!"
- [ ] Botón "Ir al Dashboard" funciona
- [ ] Al hacer click, redirige a `/dashboard` y muestra contenido normal

---

## 2. VERIFICACIÓN DE DATOS EN DB

### 2.1 Propiedad
- [ ] Verificar en Supabase: tabla `properties`
  - [ ] `tenant_id` correcto
  - [ ] `name` correcto
  - [ ] `location` correcto (o null si no se ingresó)

### 2.2 Cuenta Bancaria
- [ ] Verificar en Supabase: tabla `financial_accounts`
  - [ ] `property_id` correcto (debe coincidir con propiedad creada)
  - [ ] `account_type` correcto
  - [ ] `opening_balance` y `current_balance` correctos

### 2.3 Gasto
- [ ] Verificar en Supabase: tabla `expenses`
  - [ ] `property_id` correcto
  - [ ] `account_id` correcto (debe coincidir con cuenta creada)
  - [ ] `amount` y `category` correctos

### 2.4 Property Activa
- [ ] Verificar `localStorage.getItem('activePropertyId')` en DevTools
  - [ ] Debe contener el ID de la propiedad creada
- [ ] Verificar que el dashboard muestra la propiedad activa correctamente

---

## 3. i18n (ES/EN)

### 3.1 Español (ES)
- [ ] Todo el texto del wizard está en español
- [ ] Labels, botones, mensajes, toasts en español
- [ ] No hay keys visibles (ej: "onboarding.welcome")

### 3.2 Inglés (EN)
- [ ] Cambiar idioma a EN en Settings
- [ ] Recargar página y verificar wizard en inglés
- [ ] Todo el texto del wizard está en inglés
- [ ] No hay keys visibles

---

## 4. CONSOLA (0 Errores / 0 Warnings)

### 4.1 Durante Onboarding
- [ ] Abrir DevTools Console
- [ ] Navegar por los 3 pasos del wizard
- [ ] Verificar: 0 errores en consola
- [ ] Verificar: 0 warnings relevantes

### 4.2 Después de Completion
- [ ] En Dashboard después de completar onboarding
- [ ] Verificar: 0 errores en consola
- [ ] Verificar: 0 warnings relevantes

---

## 5. FLUJO COMPLETO

### 5.1 Usuario Nuevo (Sin Propiedades)
- [ ] Login con usuario nuevo
- [ ] Redirige a `/dashboard`
- [ ] Aparece wizard de onboarding
- [ ] Completar los 3 pasos
- [ ] Ver completion screen
- [ ] Click en "Ir al Dashboard"
- [ ] Dashboard muestra datos correctamente
- [ ] Property selector muestra la propiedad creada

### 5.2 Usuario Existente (Con Propiedades)
- [ ] Login con usuario que ya tiene propiedades
- [ ] Redirige a `/dashboard`
- [ ] NO aparece wizard de onboarding
- [ ] Dashboard muestra contenido normal

---

## 6. EDGE CASES

### 6.1 Skip Onboarding
- [ ] En Paso 1, click en "Omitir"
- [ ] Verificar que wizard desaparece
- [ ] Verificar que dashboard muestra estado normal (sin propiedad activa)

### 6.2 Navegación Atrás
- [ ] En Paso 2 o 3, click en "Atrás"
- [ ] Verificar que regresa al paso anterior
- [ ] Verificar que datos ingresados se mantienen

### 6.3 Errores de Validación
- [ ] Intentar crear propiedad sin nombre → muestra error
- [ ] Intentar crear cuenta con saldo negativo → muestra error
- [ ] Intentar crear gasto sin monto → muestra error

---

## RESULTADO FINAL

- [x] **PASS/FAIL:** ✅ PASS (Verificación de código completada)
- [x] **Notas:**
  - ✅ Todos los módulos tienen el guard aplicado correctamente
  - ✅ Todos los formularios verifican `canWrite` antes de submit
  - ✅ Todos los botones tienen `disabled={!canWrite}`
  - ✅ 0 errores de lint
  - ⏳ Testing manual pendiente (requiere ejecución en navegador)
- [x] **Errores encontrados:** Ninguno en verificación de código
- [x] **Scripts de Testing:**
  - `scripts/test-onboarding.sql` - Limpiar datos para probar onboarding
  - `scripts/test-trial-expired.sql` - Expirar trial para probar modo solo lectura

---

## PRÓXIMOS PASOS

Después de completar este testing:
1. ✅ Verificación de código completada
2. ⏳ **Ejecutar testing manual** siguiendo este checklist en navegador
3. ⏳ Si todo pasa → commit y push a main
4. ⏳ Verificar deploy en Vercel y probar en producción (móvil)

**Ver resultados detallados en:** `/docs/PHASE_4_TESTING_RESULTS.md`

