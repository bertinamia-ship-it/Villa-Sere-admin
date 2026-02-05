# Reinstalar PWA para Ver Icono Nuevo

## iOS (iPhone/iPad)

Para ver el nuevo icono de la app en iOS, necesitas **reinstalar la PWA**:

1. **Eliminar la app actual:**
   - Mantén presionado el icono de CasaPilot en tu pantalla de inicio
   - Selecciona "Eliminar App" o "Remove App"
   - Confirma la eliminación

2. **Reinstalar la app:**
   - Abre Safari
   - Ve a la URL de la app (tu dominio de Vercel)
   - Toca el botón "Compartir" (cuadrado con flecha hacia arriba)
   - Selecciona "Agregar a Pantalla de Inicio" o "Add to Home Screen"
   - Confirma la instalación

3. **Verificar:**
   - El nuevo icono debería aparecer en tu pantalla de inicio
   - Si aún ves el icono viejo, limpia la caché de Safari:
     - Configuración → Safari → Borrar Historial y Datos de Sitios Web

## Android (Chrome)

1. **Eliminar la app actual:**
   - Mantén presionado el icono de CasaPilot
   - Arrastra hacia "Desinstalar" o "Uninstall"

2. **Reinstalar:**
   - Abre Chrome
   - Ve a la URL de la app
   - Toca el menú (3 puntos) → "Instalar app" o "Install app"
   - Confirma la instalación

3. **Verificar:**
   - El nuevo icono debería aparecer
   - Si no, limpia la caché de Chrome:
     - Configuración → Privacidad → Borrar datos de navegación → Caché

## Nota Importante

Los navegadores y sistemas operativos **cachean agresivamente** los iconos de PWA. Si después de reinstalar aún ves el icono viejo:

- Espera unos minutos (el caché puede tardar en actualizarse)
- Reinicia el dispositivo
- Limpia completamente la caché del navegador

El icono nuevo está configurado con versión `?v=4` en `manifest.json` y `layout.tsx` para forzar la actualización.

