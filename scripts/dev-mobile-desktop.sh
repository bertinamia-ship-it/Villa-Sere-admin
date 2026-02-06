#!/bin/bash

# Script para abrir la app en desktop y móvil simultáneamente

echo "🚀 Iniciando servidor de desarrollo..."
echo "📱 Desktop: http://localhost:3000"
echo "📱 Mobile: http://localhost:3000 (usa DevTools para modo móvil)"
echo ""
echo "Presiona Ctrl+C para detener"

# Iniciar servidor en background
npm run dev &
DEV_PID=$!

# Esperar a que el servidor esté listo
sleep 5

# Abrir navegador en modo desktop
if command -v open &> /dev/null; then
    # macOS
    open "http://localhost:3000"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:3000"
fi

echo ""
echo "✅ Servidor corriendo en http://localhost:3000"
echo ""
echo "Para ver la versión móvil:"
echo "1. Abre http://localhost:3000 en otra pestaña"
echo "2. Presiona F12 (o Cmd+Option+I en Mac)"
echo "3. Activa el modo dispositivo móvil (Ctrl+Shift+M o Cmd+Shift+M)"
echo "4. Selecciona un dispositivo móvil (iPhone, etc.)"
echo ""
echo "O usa este comando para abrir directamente en modo móvil:"
echo "  npm run dev:mobile"
echo ""

# Esperar a que el usuario presione Ctrl+C
trap "kill $DEV_PID; exit" INT TERM
wait $DEV_PID

