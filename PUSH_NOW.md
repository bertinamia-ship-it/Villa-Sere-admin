# ⚡ PUSH A PRODUCCIÓN - INSTRUCCIONES

## Paso 1: Verificar Estado
```bash
git status
git remote -v
```

## Paso 2: Push Normal
```bash
git push origin main
```

## Paso 3: Si Falla por SSL

### Opción A: Verificar Fecha/Hora
```bash
date
# Si está mal, ajustar (macOS):
sudo sntp -sS time.apple.com
```

### Opción B: Cambiar a SSH
```bash
# Verificar SSH
ssh -T git@github.com

# Cambiar remote
git remote set-url origin git@github.com:bertinamia-ship-it/Villa-Sere-admin.git

# Push
git push origin main
```

### Opción C: GitHub Token (HTTPS)
```bash
# Crear token: GitHub > Settings > Developer settings > Personal access tokens > repo
# Luego:
git remote set-url origin https://YOUR_TOKEN@github.com/bertinamia-ship-it/Villa-Sere-admin.git
git push origin main
```

## Paso 4: Verificar Vercel
1. https://vercel.com/dashboard
2. Buscar "Villa-Sere-admin"
3. Verificar deploy "Ready"
4. Probar URL producción

---

**TODO ESTÁ LISTO PARA PUSH** ✅

