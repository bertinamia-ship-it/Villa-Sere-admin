# 📱 Instrucciones para Actualizar Icono PWA

## ⚠️ IMPORTANTE: Descargar y Generar Iconos Manualmente

Debido a restricciones de red, necesitas descargar el icono manualmente y generar los tamaños.

### Paso 1: Descargar el Icono Nuevo

```bash
# Desde tu terminal, ejecuta:
cd /Users/alexis/Villa-Sere-admin
curl -L "https://res.cloudinary.com/dpmozdkfh/image/upload/v1770323108/icon_app_dkmrys.png" -o /tmp/icon_app_new.png
```

### Paso 2: Generar Tamaños

```bash
# Generar icon-192.png (192x192)
sips -z 192 192 /tmp/icon_app_new.png --out public/icon-192.png

# Generar icon-512.png (512x512)
sips -z 512 512 /tmp/icon_app_new.png --out public/icon-512.png

# Generar apple-touch-icon.png (180x180)
sips -z 180 180 /tmp/icon_app_new.png --out public/apple-touch-icon.png
```

### Paso 3: Verificar

```bash
ls -lh public/icon-*.png public/apple-touch-icon.png
```

Deberías ver:
- `icon-192.png` (~35KB)
- `icon-512.png` (~183KB)
- `apple-touch-icon.png` (~32KB)

### Paso 4: Commit y Deploy

```bash
git add public/icon-*.png public/apple-touch-icon.png
git commit -m "feat: actualizar iconos PWA sin bordes"
git push origin main
```

---

## ✅ Estado Actual

- ✅ Cache busting actualizado a `v=4` en `layout.tsx` y `manifest.json`
- ✅ `next.config.ts` configurado para Cloudinary
- ✅ Login con imagen home implementado
- ✅ PropertySelector en menú móvil implementado
- ⏳ **PENDIENTE**: Descargar y generar iconos manualmente

---

## 🎯 Después del Deploy

1. Desinstala la PWA anterior en tu iPhone
2. Limpia caché de Safari
3. Espera 5 minutos
4. Reinstala la PWA
5. Verifica que el icono nuevo aparezca (sin bordes)

