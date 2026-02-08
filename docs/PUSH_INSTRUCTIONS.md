# Instrucciones para Push a Producción

## Paso 1: Verificar Estado
```bash
git status
git remote -v
```

## Paso 2: Push Normal (HTTPS)
```bash
git push origin main
```

## Paso 3: Si Falla por SSL - Troubleshooting

### Opción A: Verificar Fecha/Hora del Sistema
```bash
date
# Si está incorrecta, ajustar:
sudo sntp -sS time.apple.com  # macOS
```

### Opción B: Cambiar a SSH
```bash
# Verificar si tienes SSH key configurada
ssh -T git@github.com

# Si funciona, cambiar remote a SSH
git remote set-url origin git@github.com:bertinamia-ship-it/Villa-Sere-admin.git

# Push con SSH
git push origin main
```

### Opción C: Usar GitHub Token (HTTPS)
```bash
# Crear token en GitHub: Settings > Developer settings > Personal access tokens
# Permisos: repo

# Configurar token
git remote set-url origin https://YOUR_TOKEN@github.com/bertinamia-ship-it/Villa-Sere-admin.git

# O usar credential helper
git config --global credential.helper store
# Luego hacer push (pedirá usuario y token como password)
git push origin main
```

## Paso 4: Verificar Vercel
1. Ir a https://vercel.com/dashboard
2. Buscar proyecto "Villa-Sere-admin"
3. Verificar que el último deploy esté "Ready"
4. Probar URL de producción

## Si Todo Falla
- Verificar conexión a internet
- Verificar que GitHub esté accesible
- Contactar soporte de GitHub si el problema persiste

