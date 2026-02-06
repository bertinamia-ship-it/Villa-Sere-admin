#!/bin/bash

# Script para abrir Chrome en modo móvil automáticamente

# Detectar sistema operativo
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    # Abrir Chrome con flags para simular móvil
    /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
        --new-window \
        --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" \
        --window-size=375,812 \
        "http://localhost:3000" 2>/dev/null || \
    open -a "Google Chrome" --args \
        --new-window \
        --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" \
        --window-size=375,812 \
        "http://localhost:3000" 2>/dev/null || \
    echo "⚠️  Chrome no encontrado. Abre http://localhost:3000 manualmente y activa DevTools (F12) > Toggle device toolbar"
else
    # Linux
    google-chrome \
        --new-window \
        --user-agent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" \
        --window-size=375,812 \
        "http://localhost:3000" 2>/dev/null || \
    echo "⚠️  Chrome no encontrado. Abre http://localhost:3000 manualmente y activa DevTools (F12) > Toggle device toolbar"
fi

