# 🚀 Desarrollo Desktop + Móvil Simultáneo

## Opción 1: Script Automático (Recomendado)

### Iniciar servidor y abrir ambas vistas:
```bash
npm run dev:all
```

Esto:
- ✅ Inicia el servidor en `http://localhost:3000`
- ✅ Abre automáticamente el navegador en modo desktop
- ✅ Te da instrucciones para ver la versión móvil

### Para ver la versión móvil después:
1. Abre otra pestaña en `http://localhost:3000`
2. Presiona **F12** (o **Cmd+Option+I** en Mac)
3. Activa el modo dispositivo móvil: **Ctrl+Shift+M** (o **Cmd+Shift+M** en Mac)
4. Selecciona un dispositivo (iPhone 12 Pro, etc.)

---

## Opción 2: Manual (Más Control)

### Paso 1: Iniciar servidor
```bash
npm run dev
```

### Paso 2: Abrir Desktop
- Abre `http://localhost:3000` en tu navegador normal

### Paso 3: Abrir Móvil
- Abre otra ventana/pestaña en `http://localhost:3000`
- Presiona **F12** para abrir DevTools
- Activa el modo dispositivo móvil (**Ctrl+Shift+M** o **Cmd+Shift+M**)
- Selecciona un dispositivo móvil (iPhone, Android, etc.)

---

## Opción 3: Dos Navegadores Diferentes

### Desktop:
```bash
npm run dev
# Abre http://localhost:3000 en Chrome/Firefox normal
```

### Móvil:
```bash
npm run dev:mobile
# Esto intenta abrir Chrome con user-agent móvil
```

---

## 💡 Tips

1. **Hot Reload**: Los cambios se reflejan automáticamente en ambas vistas
2. **DevTools Móvil**: Usa las DevTools del navegador para simular diferentes dispositivos
3. **Responsive**: Cambia el tamaño de la ventana del navegador para ver diferentes breakpoints
4. **Network Throttling**: En DevTools móvil, puedes simular conexiones lentas

---

## 🔧 Troubleshooting

### El script no funciona:
- Asegúrate de tener permisos: `chmod +x scripts/*.sh`
- En Windows, usa Git Bash o WSL

### Chrome no se abre automáticamente:
- Abre manualmente `http://localhost:3000`
- Activa DevTools (F12)
- Activa modo dispositivo móvil

### Quieres dos puertos diferentes:
- Next.js no soporta múltiples instancias fácilmente
- Usa las DevTools del navegador para simular móvil (es la forma estándar)

---

## 📱 Dispositivos Recomendados para Testing

En DevTools móvil, prueba con:
- **iPhone 12 Pro** (390x844) - Más común
- **iPhone SE** (375x667) - Pantalla pequeña
- **Samsung Galaxy S20** (360x800) - Android
- **iPad** (768x1024) - Tablet

