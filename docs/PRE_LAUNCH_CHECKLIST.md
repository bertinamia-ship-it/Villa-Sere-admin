# ✅ CHECKLIST PRE-LANZAMIENTO - CasaPilot

**Fecha:** 2026-02-09  
**Objetivo:** Verificar que la app está lista para promoción en Facebook

---

## 🎯 FEATURES CORE (MVP)

### ✅ Onboarding
- [x] Wizard de 3 pasos (propiedad → cuenta → gasto)
- [x] Se muestra solo para usuarios sin propiedades
- [x] Mobile-first design
- [x] i18n completo (ES/EN)
- [x] Redirección correcta al dashboard

### ✅ Trial System
- [x] Trial de 7 días implementado
- [x] Banner con días restantes
- [x] Modo solo lectura cuando expira
- [x] Bloqueo de acciones (crear/editar/borrar)
- [x] Redirección a Settings para activar plan

### ✅ Empty States
- [x] Bank - EmptyState guiado
- [x] Expenses - EmptyState guiado
- [x] Inventory - EmptyState guiado
- [x] Maintenance - EmptyState guiado
- [x] Todos con CTAs claros

### ✅ Módulos Funcionales
- [x] Dashboard con resumen
- [x] Rentals/Bookings
- [x] Maintenance tickets
- [x] Expenses
- [x] Bank accounts
- [x] Inventory
- [x] Tasks
- [x] Vendors
- [x] Reports
- [x] Settings

---

## 🌐 i18n (Internacionalización)

- [x] Español (ES) - 100% completo
- [x] Inglés (EN) - 100% completo
- [x] 0 keys faltantes (verificado con script)
- [x] Selector de idioma funcional
- [x] Cambio global de idioma

---

## 📱 MOBILE / PWA

- [x] Responsive design mobile-first
- [x] Hamburger menu funcional
- [x] Property selector siempre visible
- [x] Touch targets mínimos (44x44px)
- [x] Safe areas (notch/Dynamic Island)
- [x] PWA instalable (iOS/Android)
- [x] Icon correcto (192, 512, apple-touch-icon)
- [x] Manifest.json configurado
- [x] Splash screen / Home hero

---

## 🎨 UI/UX

- [x] Design system consistente
- [x] Colores y gradientes profesionales
- [x] Animaciones sutiles
- [x] Sidebar premium (desktop)
- [x] Header mobile optimizado
- [x] Cards con sombras suaves
- [x] Empty states guiados
- [x] Loading states (skeletons)
- [x] Error handling con toasts

---

## 🐛 QA / Testing

### ⏳ PENDIENTE: Testing Manual Completo
- [ ] **CRÍTICO:** Ejecutar `TESTING_RUNBOOK.md` completo
- [ ] Testing onboarding (nuevo usuario)
- [ ] Testing trial expirado (modo solo lectura)
- [ ] Testing en iPhone (Safari PWA)
- [ ] Testing en Android (Chrome PWA)
- [ ] Testing en desktop (Chrome/Firefox)
- [ ] Verificar 0 errores en consola
- [ ] Verificar 0 keys i18n visibles
- [ ] Verificar todas las funcionalidades core

### ✅ Testing Pack Preparado
- [x] TESTING_RUNBOOK.md creado
- [x] QAMode component creado
- [x] Scripts de verificación i18n
- [x] Documentación completa

---

## 🚀 DEPLOY / PRODUCCIÓN

### ✅ Deploy Final (EN PROGRESO)
- [x] **CRÍTICO:** Commit todos los cambios
- [x] **CRÍTICO:** Push a main
- [ ] **CRÍTICO:** Verificar deploy en Vercel (verificar dashboard)
- [ ] **CRÍTICO:** Testing en producción (URL real)
- [ ] Verificar PWA instalable en producción
- [ ] Verificar icon aparece correctamente
- [ ] Verificar performance (Lighthouse)
- [ ] Verificar que no hay errores 400/500

---

## 💳 PAGOS (FUTURO - NO BLOQUEA)

- [ ] Integración Stripe (futuro)
- [ ] Checkout flow (futuro)
- [ ] Webhooks de pago (futuro)
- [ ] Gestión de suscripciones (futuro)

**NOTA:** Los pagos NO bloquean el lanzamiento. La UI de "Mi Plan" ya está lista y muestra "Pagos próximamente".

---

## 📋 CHECKLIST FINAL PRE-FACEBOOK

### ANTES de promocionar, verificar:

1. **Testing Manual Completo** ⚠️ **CRÍTICO**
   - [ ] Ejecutar TESTING_RUNBOOK.md
   - [ ] Probar onboarding completo
   - [ ] Probar trial expirado
   - [ ] Probar en iPhone PWA
   - [ ] Probar en Android PWA
   - [ ] Probar en desktop
   - [ ] 0 errores en consola
   - [ ] 0 keys i18n visibles

2. **Deploy a Producción** ⚠️ **CRÍTICO**
   - [ ] Commit todos los cambios
   - [ ] Push a main
   - [ ] Verificar deploy en Vercel (Ready)
   - [ ] Testing en URL de producción
   - [ ] PWA instalable funciona
   - [ ] Icon aparece correctamente

3. **Verificación Final**
   - [ ] Login funciona
   - [ ] Onboarding aparece para nuevos usuarios
   - [ ] Trial banner aparece correctamente
   - [ ] Todos los módulos cargan sin errores
   - [ ] Mobile funciona perfectamente
   - [ ] Desktop funciona perfectamente
   - [ ] i18n ES/EN funciona globalmente

4. **Preparación Marketing**
   - [ ] Screenshots de la app (mobile + desktop)
   - [ ] Video demo (opcional)
   - [ ] Descripción del producto lista
   - [ ] Landing page o link de registro

---

## ⚠️ ACCIONES CRÍTICAS ANTES DE FACEBOOK

### 1. Testing Manual (OBLIGATORIO)
```bash
# Seguir TESTING_RUNBOOK.md completo
# Especialmente:
- Nuevo usuario → onboarding
- Trial expirado → modo solo lectura
- iPhone PWA instalado
- Android PWA instalado
```

### 2. Deploy Final (OBLIGATORIO)
```bash
git add .
git commit -m "feat: testing pack completo + i18n 100% + QA mode"
git push origin main
# Verificar Vercel deploy
# Testing en producción
```

### 3. Verificación Producción (OBLIGATORIO)
- Abrir URL de producción
- Instalar como PWA
- Probar flujo completo
- Verificar 0 errores consola

---

## ✅ LO QUE YA ESTÁ LISTO

- ✅ Features core completas
- ✅ Onboarding implementado
- ✅ Trial system implementado
- ✅ i18n 100% (ES/EN)
- ✅ Mobile/PWA optimizado
- ✅ UI/UX profesional
- ✅ Testing Pack preparado
- ✅ Documentación completa

---

## 🎯 CONCLUSIÓN

**Estado:** 🟡 **CASI LISTO** (falta testing manual + deploy final)

**Puedes promocionar en Facebook DESPUÉS de:**
1. ✅ Ejecutar testing manual completo
2. ✅ Deploy final a producción
3. ✅ Verificar que todo funciona en producción

**Tiempo estimado:** 2-3 horas (testing + deploy + verificación)

---

## 📝 NOTAS

- Los pagos NO bloquean el lanzamiento (UI lista, integración futura)
- El testing manual es CRÍTICO antes de promocionar
- El deploy a producción debe estar verificado
- La app está funcionalmente completa para MVP

