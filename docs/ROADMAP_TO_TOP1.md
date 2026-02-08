# 🚀 Roadmap: CasaPilot → App #1

## 📊 Análisis Actual vs. Objetivo

### Estado Actual
- ✅ Diseño visual moderno y colorido
- ✅ Internacionalización (ES/EN)
- ✅ PWA funcional
- ✅ Multi-tenant y multi-property
- ⚠️ Performance: Mejorable
- ⚠️ UX móvil: Algunos problemas específicos
- ⚠️ Organización: Algunos módulos necesitan refinamiento

---

## 🎯 PRIORIDAD 1: UX MÓVIL (Crítico para PWA)

### 1.1 Banco / Caja Chica - Botones en Móvil
**Problema identificado:**
- En `AccountDetail.tsx` (líneas 171-192), los botones "Agregar dinero" y "Registrar salida" están en `flex gap-2` horizontal
- En móvil se ven apretados, pequeños, o se cortan
- No tienen `min-h-[44px]` garantizado
- No son full-width en móvil

**Solución:**
```tsx
// Cambiar de:
<div className="flex gap-2">
  <Button>Agregar dinero</Button>
  <Button>Registrar salida</Button>
</div>

// A:
<div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
  <Button className="w-full sm:w-auto min-h-[44px]">
    Agregar dinero
  </Button>
  <Button className="w-full sm:w-auto min-h-[44px]">
    Registar salida
  </Button>
</div>
```

**Archivos a modificar:**
- `app/(dashboard)/bank/AccountDetail.tsx` (líneas 171-192)
- `app/(dashboard)/bank/page.tsx` (verificar botón "Nueva Cuenta")
- `app/(dashboard)/bank/TransactionForm.tsx` (verificar botones del formulario)

### 1.2 Tablas en Móvil (Todos los módulos)
**Problema:**
- Tablas con scroll horizontal no son ideales en móvil
- Algunos módulos ya tienen vista de cards, pero no todos

**Módulos a revisar:**
- ✅ `bank/AccountDetail.tsx` - Ya tiene cards móviles
- ⚠️ `expenses/page.tsx` - Verificar si tiene cards móviles
- ⚠️ `reports/page.tsx` - Probablemente solo tabla
- ⚠️ `maintenance/page.tsx` - Verificar responsive
- ⚠️ `tasks/page.tsx` - Verificar responsive

**Solución estándar:**
- Desktop: Tabla completa
- Móvil: Cards con toda la información importante
- Usar `hidden md:block` para tabla y `md:hidden` para cards

### 1.3 Formularios en Móvil
**Problemas comunes:**
- Inputs muy pequeños
- Botones fuera de vista (necesitan sticky bottom)
- Labels que se cortan
- Selects/Date pickers que no funcionan bien en iOS

**Módulos a revisar:**
- `bank/AccountForm.tsx`
- `bank/TransactionForm.tsx`
- `expenses/ExpenseForm.tsx`
- `maintenance/MaintenanceForm.tsx`
- `tasks/TaskForm.tsx`
- `inventory/InventoryForm.tsx`

**Mejoras necesarias:**
1. Todos los inputs: `min-h-[44px]` en móvil
2. Formularios largos: Sticky bottom bar con botón "Guardar"
3. Date pickers: Usar `type="date"` nativo (funciona bien en iOS)
4. Selects: Verificar que sean táctiles (min 44x44px)

### 1.4 Modales en Móvil
**Problema:**
- Modales muy grandes que no caben en pantalla
- Botones cortados
- Scroll interno no funciona bien

**Solución:**
- Modales en móvil: Full-screen o bottom sheet
- Botones siempre visibles (sticky bottom)
- Safe-area respetada

---

## ⚡ PRIORIDAD 2: PERFORMANCE (Velocidad = Experiencia Premium)

### 2.1 Lazy Loading de Módulos Pesados
**Módulos a lazy-load:**
1. `/bank` - Gestión compleja de cuentas
2. `/reports` - Agregaciones pesadas
3. `/inventory` - Listas grandes de items
4. `/expenses` - Muchos registros

**Implementación:**
```tsx
// En layout.tsx o routing
const BankPage = dynamic(() => import('./bank/page'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Opcional para client-only
})
```

**Impacto esperado:**
- Reducción de bundle inicial: ~30-40%
- Tiempo de carga inicial: -50%
- Time to Interactive: -40%

### 2.2 Optimización de Queries
**Problemas actuales:**
- Cada módulo hace queries independientes
- No hay cache de datos comunes (profile, properties)
- Re-fetch innecesario al cambiar de ruta

**Mejoras:**
1. **Cache de Profile/Properties:**
   - Usar React Query o SWR
   - Cache en memoria + localStorage
   - Invalidación inteligente

2. **Batch Queries:**
   - Combinar queries relacionadas
   - Usar `select` específico (no `*`)

3. **Paginación:**
   - Listas grandes (expenses, transactions, inventory)
   - Infinite scroll o paginación tradicional

### 2.3 Optimización de Imágenes
**Estado actual:**
- Usando `next/image` ✅
- Pero algunas imágenes no optimizadas

**Mejoras:**
- Verificar que todas usen `next/image`
- Lazy loading de imágenes fuera de viewport
- WebP/AVIF cuando sea posible

### 2.4 Code Splitting
**Vendor bundles:**
- Separar librerías pesadas (charts, date pickers)
- Dynamic imports para componentes pesados

---

## 🎨 PRIORIDAD 3: UX/UI REFINEMENTS

### 3.1 Consistencia Visual
**Problemas:**
- Algunos botones tienen diferentes tamaños
- Espaciados inconsistentes entre módulos
- Colores/gradientes no uniformes

**Solución:**
- Design system documentado
- Componentes base consistentes
- Spacing scale unificado

### 3.2 Feedback Visual
**Mejoras:**
- Loading states más claros
- Skeleton loaders en lugar de spinners
- Transiciones más suaves
- Micro-interacciones (hover, click)

### 3.3 Empty States
**Estado actual:**
- Algunos módulos tienen empty states
- Pero no todos son consistentes

**Solución:**
- Empty state component unificado
- Ilustraciones/iconos consistentes
- CTAs claros

### 3.4 Error Handling
**Mejoras:**
- Mensajes de error más amigables
- Retry automático en errores de red
- Offline detection y mensajes

---

## 📱 PRIORIDAD 4: FUNCIONALIDADES PREMIUM

### 4.1 Búsqueda Global
**Funcionalidad:**
- Búsqueda rápida (Cmd/Ctrl + K)
- Buscar en: expenses, bookings, inventory, tasks
- Resultados instantáneos

### 4.2 Filtros Avanzados
**Módulos que necesitan:**
- Expenses: Por rango de fechas, categoría, proveedor
- Bookings: Por estado, rango de fechas
- Tasks: Por prioridad, estado, fecha
- Inventory: Por categoría, ubicación, stock bajo

### 4.3 Exportación de Datos
**Funcionalidades:**
- Exportar a CSV/Excel
- Exportar a PDF (reportes)
- Programar exports automáticos

### 4.4 Notificaciones
**Tipos:**
- Push notifications (PWA)
- Recordatorios de tareas
- Alertas de stock bajo
- Notificaciones de bookings próximos

### 4.5 Dashboard Mejorado
**Mejoras:**
- Widgets personalizables
- Gráficos interactivos
- KPIs más claros
- Vista rápida de todo

---

## 🔒 PRIORIDAD 5: SEGURIDAD Y CONFIABILIDAD

### 5.1 Validación de Formularios
**Mejoras:**
- Validación en tiempo real
- Mensajes de error claros
- Prevención de datos inválidos

### 5.2 Backup y Sincronización
**Funcionalidades:**
- Backup automático
- Sincronización offline
- Conflict resolution

### 5.3 Auditoría
**Funcionalidades:**
- Log de cambios importantes
- Historial de acciones
- Trazabilidad de datos

---

## 📊 PRIORIDAD 6: ANALYTICS Y REPORTES

### 6.1 Reportes Mejorados
**Mejoras:**
- Más tipos de reportes
- Exportación a PDF
- Gráficos interactivos
- Comparativas (mes a mes, año a año)

### 6.2 Analytics
**Funcionalidades:**
- Métricas de uso de la app
- Tendencias de gastos
- Análisis de ocupación
- Predicciones básicas

---

## 🎯 PLAN DE ACCIÓN INMEDIATO (Esta Semana)

### Día 1-2: UX Móvil Crítico
1. ✅ Arreglar botones en `bank/AccountDetail.tsx`
2. ✅ Revisar y arreglar todos los formularios móviles
3. ✅ Verificar y mejorar modales en móvil
4. ✅ Asegurar min-h-[44px] en todos los botones móviles

### Día 3-4: Performance
1. ✅ Implementar lazy loading de módulos pesados
2. ✅ Agregar cache de profile/properties
3. ✅ Optimizar queries (paginación donde aplique)

### Día 5: Polish Final
1. ✅ Consistencia visual
2. ✅ Loading states mejorados
3. ✅ Empty states unificados

---

## 📈 MÉTRICAS DE ÉXITO

### Performance (Lighthouse Mobile)
- **FCP (First Contentful Paint):** < 1.5s
- **LCP (Largest Contentful Paint):** < 2.5s
- **TTI (Time to Interactive):** < 3.5s
- **TBT (Total Blocking Time):** < 200ms
- **CLS (Cumulative Layout Shift):** < 0.1

### UX Móvil
- ✅ Todos los botones: min 44x44px
- ✅ Sin scroll horizontal forzado
- ✅ Formularios 100% usables
- ✅ Modales siempre accesibles

### Funcionalidad
- ✅ 0 errores en consola
- ✅ 0 warnings de React
- ✅ 100% de traducciones (ES/EN)
- ✅ PWA instalable y funcional

---

## 🎨 MEJORAS DE DISEÑO ESPECÍFICAS

### Banco / Caja Chica
1. **Botones en AccountDetail:**
   - Móvil: Stack vertical, full-width
   - Desktop: Horizontal, auto-width
   - Min height: 44px siempre

2. **Cards de Cuentas:**
   - Mejor spacing en móvil
   - Touch targets más grandes
   - Animaciones más suaves

3. **Formulario de Transacciones:**
   - Sticky bottom bar en móvil
   - Inputs más grandes
   - Date picker nativo (iOS-friendly)

### Otros Módulos
1. **Expenses:**
   - Cards móviles mejoradas
   - Filtros más accesibles
   - Formulario optimizado

2. **Maintenance:**
   - Lista de tickets más clara
   - Formulario más intuitivo
   - Estados visuales mejorados

3. **Inventory:**
   - Grid responsive mejorado
   - Búsqueda más prominente
   - Quick actions más claras

---

## 🚀 PRÓXIMOS PASOS

1. **Esta semana:** UX móvil crítico + Performance básico
2. **Próxima semana:** Funcionalidades premium + Analytics
3. **Mes siguiente:** Features avanzadas + Integraciones

---

## 💡 IDEAS ADICIONALES (Futuro)

- Dark mode
- Temas personalizables
- Integración con calendarios externos
- API pública
- App móvil nativa (React Native)
- Integración con sistemas de pago
- Multi-idioma adicional (FR, PT)
- Modo offline completo
- Sincronización en tiempo real
- Colaboración en tiempo real

---

**Última actualización:** 2025-01-XX
**Estado:** En progreso

