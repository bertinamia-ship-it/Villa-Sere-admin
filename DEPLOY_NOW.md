# 🚀 DEPLOY FINAL - CasaPilot

**Fecha:** 2026-02-09  
**Estado:** Listo para deploy

---

## 📋 Comandos para Ejecutar

### 1. Remover lock file (si existe)
```bash
rm -f .git/index.lock
```

### 2. Agregar todos los cambios
```bash
git add -A
```

### 3. Commit
```bash
git commit -m "feat: testing pack completo + i18n 100% + QA mode + pre-launch checklist

- ✅ Testing Pack completo (TESTING_RUNBOOK.md, QAMode, scripts)
- ✅ i18n 100% (0 keys faltantes en ES/EN)
- ✅ Keys agregadas: common.select, settings.myPlan.*, errors.tableNotFound
- ✅ QAMode integrado en layout (dev only)
- ✅ FetchInterceptor integrado (silencia errores 400 telemetría)
- ✅ next.config.ts corregido (removidas opciones inválidas Next.js 16)
- ✅ PRE_LAUNCH_CHECKLIST.md creado
- ✅ useTrialGuard aplicado en todos los módulos
- ✅ Testing manual preparado para ejecución

Ready for production deployment."
```

### 4. Push a main
```bash
git push origin main
```

---

## ✅ Verificación Post-Deploy

Después del push, verifica en Vercel:

1. **Dashboard Vercel:**
   - [ ] Deploy iniciado automáticamente
   - [ ] Build exitoso (sin errores)
   - [ ] Status: "Ready" o "Ready (Production)"

2. **Testing en Producción:**
   - [ ] Abrir URL de producción
   - [ ] Login funciona
   - [ ] Dashboard carga correctamente
   - [ ] Onboarding aparece para nuevos usuarios
   - [ ] Trial banner aparece correctamente
   - [ ] PWA instalable funciona
   - [ ] Icon aparece correctamente
   - [ ] 0 errores en consola

3. **Módulos Core:**
   - [ ] Rentals funciona
   - [ ] Bank funciona
   - [ ] Expenses funciona
   - [ ] Maintenance funciona
   - [ ] Tasks funciona
   - [ ] Inventory funciona
   - [ ] Settings funciona

---

## 📝 Notas

- Si hay errores en el build, revisa los logs en Vercel
- Si el deploy falla, verifica las variables de entorno en Vercel
- Después del deploy exitoso, ejecuta el testing manual completo

---

## 🎯 Siguiente Paso

Después del deploy exitoso:
1. ✅ Testing manual completo (TESTING_RUNBOOK.md)
2. ✅ Verificación en producción
3. ✅ Listo para promoción en Facebook

