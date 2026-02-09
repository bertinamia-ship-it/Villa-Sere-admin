# INSTRUCCIONES PARA TESTING MANUAL FASE 4

**IMPORTANTE:** Este documento contiene las instrucciones paso a paso para ejecutar el testing manual completo.

---

## PREPARACIÓN

### 1. Scripts SQL Preparados
- `scripts/test-onboarding.sql` - Limpiar datos para probar onboarding
- `scripts/test-trial-expired.sql` - Expirar trial para probar modo solo lectura

### 2. Herramientas Necesarias
- Navegador (Chrome/Firefox/Safari)
- DevTools Console abierta
- Acceso a Supabase SQL Editor
- Email de usuario de prueba

---

## ESCENARIO A: USUARIO NUEVO (ONBOARDING)

### Paso 1: Limpiar Datos
1. Abrir Supabase SQL Editor
2. Ejecutar `scripts/test-onboarding.sql`
3. **Reemplazar** `'TU_EMAIL_AQUI@ejemplo.com'` con el email real del usuario
4. Ejecutar el script
5. Verificar que `property_count = 0`

### Paso 2: Limpiar LocalStorage
1. Abrir navegador en modo incógnito (o limpiar datos)
2. Abrir DevTools Console (F12)
3. Ejecutar: `localStorage.removeItem('activePropertyId')`
4. Cerrar y reabrir la pestaña

### Paso 3: Login y Verificar Onboarding
1. Login con el usuario de prueba
2. Debe redirigir a `/dashboard`
3. **VERIFICAR:** Aparece wizard de onboarding con "¡Bienvenido a CasaPilot!"
4. **VERIFICAR:** No hay errores en consola

### Paso 4: Paso 1 - Crear Propiedad
1. Formulario muestra: Nombre y Ubicación (opcional)
2. **TEST:** Intentar crear sin nombre → debe mostrar error
3. Ingresar nombre: "Villa Test"
4. Click en "Crear Propiedad"
5. **VERIFICAR:**
   - Toast: "Propiedad creada exitosamente"
   - Avanza al Paso 2
   - En Supabase: `properties` tiene nuevo registro con `name = 'Villa Test'`
   - En DevTools: `localStorage.getItem('activePropertyId')` tiene un UUID

### Paso 5: Paso 2 - Crear Cuenta Bancaria
1. Formulario muestra: Nombre, Tipo, Saldo inicial
2. **TEST:** Intentar crear con saldo negativo → debe mostrar error
3. Ingresar:
   - Nombre: "Cuenta Test"
   - Tipo: "Efectivo"
   - Saldo inicial: "1000"
4. Click en "Crear Cuenta"
5. **VERIFICAR:**
   - Toast: "Cuenta creada exitosamente"
   - Avanza al Paso 3
   - En Supabase: `financial_accounts` tiene nuevo registro con `name = 'Cuenta Test'` y `property_id` correcto

### Paso 6: Paso 3 - Crear Primer Gasto
1. Formulario muestra: Fecha, Monto, Categoría
2. **TEST:** Intentar crear sin monto → debe mostrar error
3. Ingresar:
   - Fecha: (hoy)
   - Monto: "50"
   - Categoría: "Mantenimiento"
4. Click en "Crear Gasto"
5. **VERIFICAR:**
   - Toast: "Gasto registrado exitosamente"
   - Avanza al Paso 4 (completion)
   - En Supabase: `expenses` tiene nuevo registro con `amount = 50` y `property_id` y `account_id` correctos

### Paso 7: Paso 4 - Completion
1. **VERIFICAR:** Muestra mensaje "¡Todo listo!"
2. Click en "Ir al Dashboard"
3. **VERIFICAR:**
   - Redirige a `/dashboard`
   - Dashboard muestra contenido normal
   - Property selector muestra "Villa Test"
   - Bank muestra "Cuenta Test" con saldo $1000
   - Expenses muestra el gasto de $50

### Paso 8: Verificar i18n (ES/EN)
1. Ir a Settings
2. Cambiar idioma a EN
3. **VERIFICAR:** Todo el texto cambia a inglés
4. Recargar página
5. **VERIFICAR:** Wizard (si aparece) está en inglés
6. Cambiar idioma a ES
7. **VERIFICAR:** Todo vuelve a español
8. **VERIFICAR:** No hay keys visibles (ej: "onboarding.welcome")

### Paso 9: Verificar Consola
1. Abrir DevTools Console
2. Navegar por todos los módulos
3. **VERIFICAR:**
   - 0 errores en consola
   - 0 warnings relevantes
   - 0 requests 400/401/404/500 en Network tab

---

## ESCENARIO B: TRIAL EXPIRADO (MODO SOLO LECTURA)

### Paso 1: Expirar Trial
1. Abrir Supabase SQL Editor
2. Ejecutar `scripts/test-trial-expired.sql`
3. **Reemplazar** `'TU_EMAIL_AQUI@ejemplo.com'` con el email real del usuario
4. Ejecutar el script
5. Verificar que `trial_status = 'Expirado'`

### Paso 2: Verificar Estado
1. Login con el usuario
2. Ir a Settings
3. **VERIFICAR:** Sección "Mi Plan" muestra "Trial Expirado" (badge rojo)
4. **VERIFICAR:** Banner de trial NO aparece (trial expirado)

### Paso 3: Probar Bank
1. Ir a `/bank`
2. **VERIFICAR:** Botón "Nueva Cuenta" está disabled
3. Click en botón disabled
4. **VERIFICAR:** No hace nada (botón disabled)
5. Si hay cuenta existente:
   - Click en botón editar → **VERIFICAR:** disabled
   - Click en botón eliminar → **VERIFICAR:** disabled
6. Si hay cuenta seleccionada:
   - Click en "Agregar dinero" → **VERIFICAR:** disabled
   - Click en "Registrar salida" → **VERIFICAR:** disabled
7. **VERIFICAR:** Lectura de cuentas y transacciones funciona normalmente

### Paso 4: Probar Expenses
1. Ir a `/expenses`
2. **VERIFICAR:** Botón "Agregar Gasto" está disabled
3. Click en botón disabled → **VERIFICAR:** No hace nada
4. Si hay gastos:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
5. **VERIFICAR:** Lectura de gastos funciona normalmente

### Paso 5: Probar Maintenance
1. Ir a `/maintenance`
2. **VERIFICAR:** Botón "Nuevo Ticket" está disabled
3. Si hay tickets:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
4. **VERIFICAR:** Lectura de tickets funciona normalmente

### Paso 6: Probar Tasks
1. Ir a `/tasks`
2. **VERIFICAR:** Botón "Nueva Tarea" está disabled
3. Si hay tareas:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
4. **VERIFICAR:** Lectura de tareas funciona normalmente

### Paso 7: Probar Inventory
1. Ir a `/inventory`
2. **VERIFICAR:** Botón "Agregar Item" está disabled
3. Si hay items:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
4. **VERIFICAR:** Lectura de items funciona normalmente

### Paso 8: Probar Vendors
1. Ir a `/vendors`
2. **VERIFICAR:** Botón "Agregar Proveedor" está disabled
3. Si hay proveedores:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
4. **VERIFICAR:** Lectura de proveedores funciona normalmente

### Paso 9: Probar To-Buy
1. Ir a `/to-buy`
2. **VERIFICAR:** Botón "Agregar Item" está disabled
3. Si hay items:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
4. **VERIFICAR:** Lectura de items funciona normalmente

### Paso 10: Probar Rentals
1. Ir a `/rentals`
2. **VERIFICAR:** Botón "Nueva Reserva" está disabled
3. Si hay bookings:
   - Click en editar → **VERIFICAR:** disabled
   - Click en eliminar → **VERIFICAR:** disabled
4. **VERIFICAR:** Lectura de bookings funciona normalmente

### Paso 11: Verificar Navegación
1. Navegar entre todos los módulos
2. **VERIFICAR:** Navegación funciona normalmente
3. **VERIFICAR:** Lectura de datos funciona normalmente
4. **VERIFICAR:** Solo acciones de escritura están bloqueadas

### Paso 12: Verificar Consola
1. Abrir DevTools Console
2. Navegar por todos los módulos
3. Intentar acciones bloqueadas
4. **VERIFICAR:**
   - 0 errores en consola
   - 0 warnings relevantes
   - 0 requests 400/401/404/500 en Network tab

---

## NOTAS IMPORTANTES

1. **Testing en Móvil:** Repetir todos los pasos en móvil (iPhone Safari o Android Chrome)
2. **Testing en Desktop:** Repetir todos los pasos en desktop
3. **i18n:** Verificar que TODO cambia con el idioma (no solo menús)
4. **Consola:** Verificar 0 errores en ambos escenarios

---

## RESULTADOS

Llenar `/docs/PHASE_4_TESTING_RESULTS.md` con:
- PASS/FAIL para cada verificación
- Notas de cualquier problema encontrado
- Screenshots si es necesario

