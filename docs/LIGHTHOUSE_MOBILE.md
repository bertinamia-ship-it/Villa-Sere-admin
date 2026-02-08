# Lighthouse Mobile - Performance Metrics

**Fecha:** 2025-01-27  
**Objetivo:** Medir y documentar métricas de performance en móvil para identificar oportunidades de optimización.

---

## Métricas Objetivo

- **FCP (First Contentful Paint):** < 1.8s
- **LCP (Largest Contentful Paint):** < 2.5s
- **TTI (Time to Interactive):** < 3.8s
- **CLS (Cumulative Layout Shift):** < 0.1
- **FID (First Input Delay):** < 100ms

---

## Métricas Actuales (Producción)

**URL:** [URL de producción Vercel]  
**Fecha de medición:** [Fecha]  
**Nota:** Ejecutar Lighthouse Mobile en producción (modo incógnito) y actualizar este documento.

### Instrucciones para Medición:
1. Abrir Chrome DevTools (F12) en modo incógnito
2. Ir a pestaña "Lighthouse"
3. Seleccionar "Mobile" y "Performance"
4. Marcar "Clear storage" (importante para medición limpia)
5. Click en "Analyze page load"
6. Esperar a que complete el análisis
7. Copiar métricas y pegar aquí:
   - Performance Score
   - FCP, LCP, TTI, TBT, CLS, FID
   - Top 3 Opportunities (copiar texto exacto)
   - Top 3 Diagnostics (copiar texto exacto)
   - Bundle sizes (ver Network tab o Lighthouse report)

### Nota Importante:
- Medir en la URL de producción real (Vercel)
- Usar modo incógnito para evitar extensiones
- Medir después de login (página del dashboard)
- Documentar fecha y hora de la medición

### Métricas ANTES (FASE 2.5):
- **Performance Score:** _Pendiente_
- **FCP (First Contentful Paint):** _Pendiente_ (Objetivo: < 1.8s)
- **LCP (Largest Contentful Paint):** _Pendiente_ (Objetivo: < 2.5s)
- **TTI (Time to Interactive):** _Pendiente_ (Objetivo: < 3.8s)
- **TBT (Total Blocking Time):** _Pendiente_ (Objetivo: < 200ms)
- **CLS (Cumulative Layout Shift):** _Pendiente_ (Objetivo: < 0.1)
- **FID (First Input Delay):** _Pendiente_ (Objetivo: < 100ms)

### Métricas DESPUÉS (FASE 2.6):
- **Performance Score:** _Pendiente_
- **FCP (First Contentful Paint):** _Pendiente_ (Objetivo: < 1.8s)
- **LCP (Largest Contentful Paint):** _Pendiente_ (Objetivo: < 2.5s)
- **TTI (Time to Interactive):** _Pendiente_ (Objetivo: < 3.8s)
- **TBT (Total Blocking Time):** _Pendiente_ (Objetivo: < 200ms)
- **CLS (Cumulative Layout Shift):** _Pendiente_ (Objetivo: < 0.1)
- **FID (First Input Delay):** _Pendiente_ (Objetivo: < 100ms)

### Top 3 Opportunities (Lighthouse) - ANTES
1. _Pendiente_
2. _Pendiente_
3. _Pendiente_

### Top 3 Diagnostics (Lighthouse) - ANTES
1. _Pendiente_
2. _Pendiente_
3. _Pendiente_

### Bundle Size - ANTES
- **Initial JS:** _Pendiente_
- **Total JS:** _Pendiente_
- **Main bundle:** _Pendiente_

### Top 3 Opportunities (Lighthouse) - DESPUÉS
1. _Pendiente_
2. _Pendiente_
3. _Pendiente_

### Top 3 Diagnostics (Lighthouse) - DESPUÉS
1. _Pendiente_
2. _Pendiente_
3. _Pendiente_

### Bundle Size - DESPUÉS
- **Initial JS:** _Pendiente_
- **Total JS:** _Pendiente_
- **Main bundle:** _Pendiente_

---

## Optimizaciones Aplicadas

### 1. Lazy Loading ✅
- **Estado:** Completado
- **Módulos:** 
  - `/reports` → `ReportsPageContent` (dynamic import)
  - `/bank` → `BankPageContent` (dynamic import)
  - `/inventory` → `InventoryList` (dynamic import)
  - `/expenses` → `ExpensesManager` (dynamic import)
- **Loading states:** Spinner ligero con `LoadingSpinner`
- **SSR:** Deshabilitado (`ssr: false`) para módulos pesados

### 2. Reducción de Re-renders ✅
- **Estado:** Optimizado
- **Componentes memoizados:**
  - `Header` (React.memo)
  - `PropertyHeader` (React.memo)
  - `MobilePropertyCard` (React.memo)
  - `PropertySelector` (React.memo)
  - `layout.tsx` navigation (useMemo con dependencia `language`)
  - `layout.tsx` memoizedNavigation (useMemo) ✅ NUEVO FASE 3.3
  - `layout.tsx` expandedSections (useState lazy init)
  - `layout.tsx` toggleSection (useCallback)
  - `layout.tsx` isActive (useCallback)
  - `layout.tsx` handleLogout (useCallback)
  - `layout.tsx` toggleMobileMenu (useCallback)
  - `layout.tsx` closeMobileMenu (useCallback)
  - `PropertySelector` loadProperties (useCallback)
  - `PropertySelector` handlePropertyChange (useCallback)
  - `PropertySelector` getPropertyIcon (useCallback)
  - `PropertySelector` activeProperty (useMemo)
  - `PropertyHeader` loadPropertyName (useCallback) ✅ NUEVO FASE 3.3
  - `Header` loadPropertyName (useCallback) ✅ NUEVO FASE 3.3

### 3. Efectos Visuales Móvil ✅
- **Estado:** Optimizado
- **Cambios:**
  - `Card` component: `backdrop-blur-sm` solo en desktop (`sm:backdrop-blur-sm`)
  - `Card` component: `shadow-sm` en móvil, `shadow-md` en desktop
  - `Card` component: `hover:shadow-md` en móvil, `hover:shadow-lg` en desktop
- **Resultado:** Menos carga de GPU en móvil

### 4. Cache Básico ✅
- **Estado:** Implementado e Integrado
- **Archivo:** `lib/utils/cache.ts`
- **Datos cacheados:**
  - `profile` (TTL: 5 minutos)
  - `properties` (TTL: 5 minutos)
  - `tenant` (TTL: 5 minutos)
  - `property` (TTL: 5 minutos)
- **Funciones:** `set()`, `get()`, `invalidate()`, `invalidatePattern()`
- **Integración:**
  - ✅ `property-client.ts` - `getActivePropertyId()` usa cache ✅ MEJORADO FASE 3.3
  - ✅ `PropertySelector.tsx` - `loadProperties()` usa cache
  - ✅ `PropertyHeader.tsx` - `loadPropertyName()` usa cache ✅ NUEVO FASE 3.3
  - ✅ `Header.tsx` - `loadPropertyName()` usa cache ✅ NUEVO FASE 3.3
  - ✅ `tenant-client.ts` - Nuevo helper client-side con cache
  - ✅ Invalidación automática en mutaciones (create/delete property)
- **Optimización FASE 3.3:**
  - ✅ Eliminadas queries duplicadas: `PropertyHeader` y `Header` ahora comparten cache
  - ✅ `property-client.ts` cachea propiedades completas (no solo ID)
  - ✅ Invalidación automática en `propertyChanged` event

---

## Cambios Aplicados (FASE 2)

### ✅ 1. Lazy Loading Implementado
**Archivos modificados:**
- `app/(dashboard)/reports/page.tsx` → Wrapper con `dynamic()` importando `ReportsPageContent`
- `app/(dashboard)/reports/ReportsPageContent.tsx` → Componente completo movido aquí
- `app/(dashboard)/bank/page.tsx` → Wrapper con `dynamic()` importando `BankPageContent`
- `app/(dashboard)/bank/BankPageContent.tsx` → Componente completo movido aquí
- `app/(dashboard)/inventory/page.tsx` → `dynamic()` importando `InventoryList`
- `app/(dashboard)/expenses/page.tsx` → `dynamic()` importando `ExpensesManager`

**Resultado esperado:**
- Bundle inicial reducido (módulos pesados no se cargan hasta que se necesitan)
- Mejor FCP y LCP al cargar la app
- Navegación más rápida entre módulos

### ✅ 2. Cache Básico Implementado
**Archivo creado:** `lib/utils/cache.ts`
- Cache en memoria con TTL (5 minutos por defecto)
- Funciones: `set()`, `get()`, `invalidate()`, `invalidatePattern()`
- Keys helpers: `CACHE_KEYS.profile()`, `CACHE_KEYS.properties()`, etc.

**Próximo paso:** Integrar en helpers existentes (`property-client.ts`, `tenant.ts`)

### ✅ 3. Optimización de Estilos Móvil
**Archivo modificado:** `components/ui/Card.tsx`
- `backdrop-blur-sm` → Solo en desktop (`sm:backdrop-blur-sm`)
- `shadow-md` → `shadow-sm` en móvil, `shadow-md` en desktop
- `hover:shadow-lg` → `hover:shadow-md` en móvil, `hover:shadow-lg` en desktop

**Resultado:** Menos carga de GPU en móvil, mejor performance

### ✅ 4. Re-renders Optimizados
**Ya implementado:**
- `Header` (React.memo)
- `PropertyHeader` (React.memo)
- `MobilePropertyCard` (React.memo)
- `layout.tsx` navigation (useMemo con dependencia `language`)
- `layout.tsx` toggleSection (useCallback)
- `layout.tsx` isActive (useCallback)

**Completado:**
- ✅ `PropertySelector` (React.memo)
- ✅ `PropertySelector` loadProperties (useCallback)
- ✅ `PropertySelector` handlePropertyChange (useCallback)
- ✅ `PropertySelector` getPropertyIcon (useCallback)
- ✅ `PropertySelector` activeProperty (useMemo)
- ✅ `layout.tsx` handleLogout (useCallback)
- ✅ `layout.tsx` toggleMobileMenu (useCallback)
- ✅ `layout.tsx` closeMobileMenu (useCallback)

## Optimizaciones FASE 3.3 (Performance "último 20%")

### ✅ 1. Eliminación de Queries Duplicadas
- **Problema:** `PropertyHeader` y `Header` ambos hacían queries para obtener nombre de propiedad
- **Solución:** Ambos ahora usan cache compartido (`CACHE_KEYS.property`)
- **Resultado:** 1 query en lugar de 2 al cargar/cambiar propiedad

### ✅ 2. Cache Mejorado en property-client.ts
- **Antes:** Solo cacheaba profile y properties list
- **Ahora:** 
  - Cachea propiedades individuales completas (name, location) cuando se obtienen
  - `getActiveProperty()` ahora usa cache antes de hacer query
  - `getActivePropertyId()` cachea propiedades cuando las obtiene del fallback
- **Resultado:** Menos queries al navegar entre módulos

### ✅ 3. Navigation Memoizada en Layout
- **Problema:** `navigation.map()` se recreaba en cada render (desktop y mobile)
- **Solución:** `memoizedNavigation` con `useMemo` adicional, usado en ambos navs
- **Resultado:** Menos re-renders al navegar entre módulos

### ✅ 4. Callbacks Optimizados
- `PropertyHeader.loadPropertyName` → `useCallback` con cache
- `Header.loadPropertyName` → `useCallback` con cache
- **Resultado:** Funciones estables, menos re-renders, queries compartidas

### ✅ 5. Logging Solo en Dev
- `PropertyHeader`, `Header`, `property-client.ts` solo loguean errores en desarrollo
- **Resultado:** Sin logs innecesarios en producción

---

## Resumen FASE 3.3 - Performance "último 20%"

### 📊 Impacto Esperado

- **Menos queries:** ~50% reducción en queries de propiedades al navegar
- **Menos re-renders:** Layout no se re-renderiza al cambiar módulos
- **Mejor LCP:** Cache reduce tiempo de carga de datos
- **Mejor TTI:** Menos trabajo en layout = más rápido interactivo

### ⏳ Próximo Paso

**Medir Lighthouse Mobile en PRODUCCIÓN** y documentar métricas reales en este documento.

## Próximos Pasos

1. ⏳ Ejecutar Lighthouse Mobile en producción (después del deploy)
2. ⏳ Documentar métricas reales en este documento
3. ✅ Identificar cuellos de botella (completado)
4. ✅ Aplicar optimizaciones de FASE 2 (completado)
5. ⏳ Re-medir y comparar (después del deploy)
6. ✅ Integrar cache en helpers existentes (completado)
7. ✅ Optimizar PropertySelector con memo/useCallback (completado)
8. ✅ Sidebar móvil optimizado - no causa re-renders del dashboard (completado)
9. ✅ Eliminar queries duplicadas (FASE 3.3 - completado)
10. ✅ Mejorar cache de propiedades (FASE 3.3 - completado)

---

## Notas

- Las métricas deben medirse en producción (Vercel)
- Usar Chrome DevTools > Lighthouse > Mobile
- Medir en condiciones de red 3G/4G simuladas
- Documentar antes/después de optimizaciones

