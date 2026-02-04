# Instrucciones para Actualizar Iconos de la App

## 📱 Iconos Requeridos

Para que la app se vea profesional al instalarse como PWA, necesitas reemplazar estos archivos en `/public/`:

### 1. Iconos Principales
- **`icon-192.png`** - 192x192px (Android/Chrome)
- **`icon-512.png`** - 512x512px (Android/Chrome)
- **`apple-touch-icon.png`** - 180x180px (iOS Safari)

### 2. Requisitos de los Iconos

✅ **Tamaños exactos**: Los iconos deben tener exactamente las dimensiones especificadas
✅ **Fondo sólido**: Los iconos deben tener fondo sólido (no transparente) para mejor visibilidad
✅ **Formato PNG**: Todos los iconos deben estar en formato PNG
✅ **Alta calidad**: Usar imágenes de alta resolución sin compresión excesiva

### 3. Cómo Reemplazar

1. **Prepara tus iconos nuevos** con los tamaños correctos
2. **Reemplaza los archivos** en `/public/`:
   ```bash
   # Ejemplo:
   cp /ruta/a/tu/icono-192.png public/icon-192.png
   cp /ruta/a/tu/icono-512.png public/icon-512.png
   cp /ruta/a/tu/apple-icon.png public/apple-touch-icon.png
   ```

3. **Verifica que los archivos existan**:
   ```bash
   ls -lh public/icon-*.png public/apple-touch-icon.png
   ```

4. **Limpia la caché del navegador** después de desplegar:
   - En Chrome: DevTools > Application > Clear storage
   - En Safari: Settings > Safari > Clear History and Website Data

### 4. Verificación Post-Deploy

Después de desplegar:

1. **Android/Chrome**:
   - Abre la app en Chrome
   - Menú > "Instalar app" o "Add to Home Screen"
   - Verifica que el icono nuevo aparezca

2. **iOS Safari**:
   - Abre la app en Safari
   - Compartir > "Añadir a pantalla de inicio"
   - Verifica que el icono nuevo aparezca

### 5. Notas Importantes

⚠️ **Caché del navegador**: Los iconos pueden estar cacheados. Si no ves los cambios:
   - Limpia la caché del navegador
   - Desinstala la PWA y vuelve a instalarla
   - Espera unos minutos para que el navegador actualice

⚠️ **Manifest.json**: Ya está configurado correctamente, no necesita cambios

⚠️ **Tamaños**: Si los iconos no tienen el tamaño exacto, pueden verse borrosos o mal recortados

## ✅ Estado Actual

- ✅ Manifest.json configurado
- ✅ Referencias en layout.tsx configuradas
- ✅ Apple touch icon configurado
- ⏳ **Pendiente**: Reemplazar archivos de iconos físicos

## 🎨 Colores del Tema

Los colores del tema PWA están configurados para coincidir con el diseño oscuro:
- **Background**: `#0f172a` (slate-900)
- **Theme**: `#1e293b` (slate-800)

Esto asegura que la pantalla de inicio en iOS y Android tenga un fondo oscuro elegante.

