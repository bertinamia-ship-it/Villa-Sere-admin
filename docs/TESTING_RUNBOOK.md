# 🧪 TESTING RUNBOOK - FASE 4

**Objetivo:** Verificar onboarding, trial guard, y i18n en 15 minutos  
**Herramientas:** Navegador, DevTools, Supabase SQL Editor

---

## ⚙️ PREPARACIÓN (1 min)

### 1. Activar Modo QA (Opcional)
```bash
# En terminal, antes de iniciar dev server:
export NEXT_PUBLIC_QA_MODE=true
npm run dev
```

### 2. Abrir DevTools
- **Desktop:** F12 o Cmd+Option+I
- **Móvil:** Safari Web Inspector o Chrome DevTools remoto
- **Tabs necesarios:** Console + Network

---

## 📋 ESCENARIO A: USUARIO NUEVO (ONBOARDING)

### Paso 1: Limpiar Datos (Supabase SQL Editor)
```sql
-- Copiar y ejecutar scripts/test-onboarding.sql
-- REEMPLAZAR: 'TU_EMAIL_AQUI@ejemplo.com' con tu email real
-- Ejemplo: 'test@example.com'
```

**Verificar:** Query final debe mostrar `property_count = 0`

### Paso 2: Limpiar LocalStorage
```javascript
// En DevTools Console:
localStorage.removeItem('activePropertyId')
location.reload()
```

### Paso 3: Login y Verificar Wizard
1. Login con usuario de prueba
2. **DEBE VERSE:**
   - Wizard con "¡Bienvenido a CasaPilot!"
   - Descripción: "Vamos a configurar tu primera propiedad en 3 pasos simples"
   - Botones: "Omitir" y "Crear Propiedad"
3. **CONSOLA:** 0 errores

### Paso 4: Paso 1 - Crear Propiedad
1. **TEST VALIDACIÓN:** Click "Crear Propiedad" sin nombre → debe mostrar error
2. Ingresar:
   - Nombre: "Villa Test"
   - Ubicación: (opcional, dejar vacío)
3. Click "Crear Propiedad"
4. **DEBE VERSE:**
   - Toast verde: "Propiedad creada exitosamente"
   - Avanza al Paso 2
   - Formulario de cuenta bancaria

### Paso 5: Paso 2 - Crear Cuenta
1. **TEST VALIDACIÓN:** Click "Crear Cuenta" con saldo negativo → debe mostrar error
2. Ingresar:
   - Nombre: "Cuenta Test"
   - Tipo: "Efectivo"
   - Saldo inicial: "1000"
3. Click "Crear Cuenta"
4. **DEBE VERSE:**
   - Toast verde: "Cuenta creada exitosamente"
   - Avanza al Paso 3
   - Formulario de gasto

### Paso 6: Paso 3 - Crear Gasto
1. **TEST VALIDACIÓN:** Click "Crear Gasto" sin monto → debe mostrar error
2. Ingresar:
   - Fecha: (hoy, por defecto)
   - Monto: "50"
   - Categoría: "Mantenimiento"
3. Click "Crear Gasto"
4. **DEBE VERSE:**
   - Toast verde: "Gasto registrado exitosamente"
   - Avanza al Paso 4 (completion)
   - Mensaje: "¡Todo listo!"

### Paso 7: Completion y Dashboard
1. Click "Ir al Dashboard"
2. **DEBE VERSE:**
   - Dashboard normal (no wizard)
   - Property selector muestra "Villa Test"
   - Navegar a `/bank` → muestra "Cuenta Test" con saldo $1000
   - Navegar a `/expenses` → muestra gasto de $50
3. **CONSOLA:** 0 errores

### Paso 8: Verificar DB (Supabase)
```sql
-- Verificar propiedad
SELECT id, name, location FROM properties WHERE name = 'Villa Test';

-- Verificar cuenta
SELECT id, name, account_type, opening_balance, property_id 
FROM financial_accounts WHERE name = 'Cuenta Test';

-- Verificar gasto
SELECT id, amount, category, property_id, account_id 
FROM expenses WHERE amount = 50;
```

**DEBE VERSE:** Todos los registros con `property_id` correcto y relaciones correctas

---

## 📋 ESCENARIO B: TRIAL EXPIRADO (SOLO LECTURA)

### Paso 1: Expirar Trial (Supabase SQL Editor)
```sql
-- Copiar y ejecutar scripts/test-trial-expired.sql
-- REEMPLAZAR: 'TU_EMAIL_AQUI@ejemplo.com' con tu email real
```

**Verificar:** Query final debe mostrar `trial_status = 'Expirado'`

### Paso 2: Verificar Estado
1. Recargar página (o login si necesario)
2. Ir a `/settings`
3. **DEBE VERSE:**
   - Sección "Mi Plan" muestra badge rojo: "Trial Expirado"
   - NO aparece banner de trial (trial expirado)
4. **CONSOLA (QA MODE):** Debe mostrar `canWrite: false`

### Paso 3: Probar Bank (`/bank`)
1. **DEBE VERSE:**
   - Botón "Nueva Cuenta" está **disabled** (gris, no clickeable)
2. Si hay cuenta existente:
   - Botones editar/eliminar están **disabled**
3. Si hay cuenta seleccionada:
   - Botones "Agregar dinero" y "Registrar salida" están **disabled**
4. **DEBE FUNCIONAR:**
   - Ver lista de cuentas ✅
   - Ver transacciones ✅
   - Navegar normalmente ✅

### Paso 4: Probar Expenses (`/expenses`)
1. **DEBE VERSE:**
   - Botón "Agregar Gasto" está **disabled**
2. Si hay gastos:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver lista de gastos ✅
   - Ver resumen mensual ✅

### Paso 5: Probar Maintenance (`/maintenance`)
1. **DEBE VERSE:**
   - Botón "Nuevo Ticket" está **disabled**
2. Si hay tickets:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver lista de tickets ✅
   - Filtrar tickets ✅

### Paso 6: Probar Tasks (`/tasks`)
1. **DEBE VERSE:**
   - Botón "Nueva Tarea" está **disabled**
2. Si hay tareas:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver lista de tareas ✅
   - Filtrar tareas ✅

### Paso 7: Probar Inventory (`/inventory`)
1. **DEBE VERSE:**
   - Botón "Agregar Item" está **disabled**
2. Si hay items:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver lista de items ✅
   - Buscar items ✅

### Paso 8: Probar Vendors (`/vendors`)
1. **DEBE VERSE:**
   - Botón "Agregar Proveedor" está **disabled**
2. Si hay proveedores:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver lista de proveedores ✅
   - Buscar proveedores ✅

### Paso 9: Probar To-Buy (`/to-buy`)
1. **DEBE VERSE:**
   - Botón "Agregar Item" está **disabled**
2. Si hay items:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver lista de items ✅

### Paso 10: Probar Rentals (`/rentals`)
1. **DEBE VERSE:**
   - Botón "Nueva Reserva" está **disabled**
2. Si hay bookings:
   - Botones editar/eliminar están **disabled**
3. **DEBE FUNCIONAR:**
   - Ver calendario ✅
   - Ver lista de bookings ✅

### Paso 11: Verificar Navegación
1. Navegar entre todos los módulos
2. **DEBE FUNCIONAR:**
   - Navegación normal ✅
   - Lectura de datos ✅
   - Solo escritura bloqueada ✅

---

## 🌐 ESCENARIO C: i18n ES/EN

### Paso 1: Verificar Español (Default)
1. Login y navegar por módulos
2. **DEBE VERSE:**
   - Todo en español
   - Menú en español
   - Settings en español
   - Onboarding (si aparece) en español
   - **NO** hay keys visibles (ej: "onboarding.welcome")

### Paso 2: Cambiar a Inglés
1. Ir a `/settings`
2. Cambiar selector de idioma a "EN"
3. **DEBE VERSE:**
   - Todo cambia a inglés inmediatamente
   - Menú en inglés
   - Settings en inglés
   - Títulos de módulos en inglés
   - Botones en inglés

### Paso 3: Verificar Onboarding en Inglés
1. Si wizard aparece (usuario nuevo):
   - **DEBE VERSE:** Todo el wizard en inglés
   - "Welcome to CasaPilot!"
   - Botones: "Skip", "Next", "Back"

### Paso 4: Verificar Módulos en Inglés
1. Navegar por: Dashboard, Bank, Expenses, Maintenance, Tasks, Inventory, Vendors, To-Buy, Rentals
2. **DEBE VERSE:**
   - Títulos en inglés
   - Botones en inglés
   - Empty states en inglés
   - Toasts en inglés
   - **NO** hay keys visibles

### Paso 5: Volver a Español
1. Cambiar selector a "ES"
2. **DEBE VERSE:** Todo vuelve a español

---

## 🔍 ESCENARIO D: ZERO CONSOLE

### Checklist de Consola (en TODOS los escenarios)

#### Console Tab
- [ ] **0 errores rojos** (Error, ReferenceError, TypeError, etc.)
- [ ] **0 warnings amarillos relevantes** (ignorar warnings de dev tools)
- [ ] **0 mensajes de i18n** como "Translation key not found" (solo en dev, pero debe estar limpio)
- [ ] Si `NEXT_PUBLIC_QA_MODE=true`: Ver mensajes de QA (canWrite, trial status) - esto es OK

#### Network Tab
- [ ] **0 requests 400** (Bad Request)
- [ ] **0 requests 401** (Unauthorized)
- [ ] **0 requests 404** (Not Found)
- [ ] **0 requests 500** (Internal Server Error)
- [ ] Si ves 400 en console:
  - Revisar `lib/utils/fetch-interceptor.ts` (debe silenciar telemetry)
  - Revisar `next.config.ts` (telemetry: false)

### Qué Hacer si Ves Errores

#### Si ves 400 en Network:
1. Verificar URL del request
2. Si es telemetry/analytics → debe estar silenciado por `fetch-interceptor.ts`
3. Si es otro → reportar en testing results

#### Si ves keys de i18n visibles:
1. Anotar qué key se ve (ej: "inventory.setCustomAmount")
2. Verificar que existe en `lib/i18n/es.ts` y `lib/i18n/en.ts`
3. Reportar en testing results

#### Si ves errores de React:
1. Anotar el error completo
2. Verificar que no sea por `useTrialGuard` o `useI18n`
3. Reportar en testing results

---

## 🚀 COMANDOS RÁPIDOS

### Reiniciar Dev Server
```bash
# Detener: Ctrl+C
# Reiniciar:
npm run dev
```

### Limpiar Todo (LocalStorage + Cache)
```javascript
// En DevTools Console:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Verificar Estado de Trial (QA MODE)
```javascript
// En DevTools Console (si QA MODE activo):
// Debe aparecer automáticamente al entrar a cada módulo
// O manualmente:
window.__QA_TRIAL_STATUS__ // Si existe
```

---

## ✅ CHECKLIST FINAL

### Escenario A (Onboarding)
- [ ] Wizard aparece para usuario nuevo
- [ ] 3 pasos completados exitosamente
- [ ] Datos creados en DB correctamente
- [ ] Dashboard muestra datos creados
- [ ] 0 errores en consola

### Escenario B (Trial Expirado)
- [ ] Settings muestra "Trial Expirado"
- [ ] Botones disabled en todos los módulos
- [ ] Lectura funciona normalmente
- [ ] 0 errores en consola

### Escenario C (i18n)
- [ ] ES funciona completamente
- [ ] EN funciona completamente
- [ ] No hay keys visibles
- [ ] Cambio de idioma es instantáneo

### Escenario D (Zero Console)
- [ ] 0 errores en Console
- [ ] 0 warnings relevantes
- [ ] 0 requests 4xx/5xx en Network

---

## 📝 REPORTAR RESULTADOS

Llenar `/docs/PHASE_4_TESTING_RESULTS.md` con:
- ✅ PASS / ❌ FAIL para cada verificación
- Notas de problemas encontrados
- Screenshots si es necesario

---

## 🐛 TROUBLESHOOTING

### Wizard no aparece
- Verificar que usuario NO tiene propiedades en DB
- Verificar `localStorage.getItem('activePropertyId')` es null
- Verificar que `OnboardingWrapper` está renderizado

### Botones no están disabled
- Verificar que trial está expirado en DB
- Verificar que `useTrialGuard` retorna `canWrite = false`
- Verificar que botones tienen `disabled={!canWrite}`

### Keys visibles en UI
- Ejecutar `scripts/check-i18n-keys.mjs`
- Verificar que key existe en `lib/i18n/es.ts` y `lib/i18n/en.ts`
- Agregar key faltante

### Errores 400 en Network
- Verificar `lib/utils/fetch-interceptor.ts` está activo
- Verificar `next.config.ts` tiene `telemetry: false`
- Si persiste, reportar URL del request

