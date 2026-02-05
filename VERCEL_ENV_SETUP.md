# 🔧 Configurar Variables de Entorno en Vercel

## ⚠️ Error Actual
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

Este error ocurre porque faltan las variables de entorno de Supabase en Vercel.

---

## ✅ Solución: Agregar Variables en Vercel

### Paso 1: Ir a Settings de tu Proyecto en Vercel
1. Ve a [vercel.com](https://vercel.com)
2. Selecciona tu proyecto **Villa-Sere-admin**
3. Ve a **Settings** → **Environment Variables**

### Paso 2: Agregar las Variables

Agrega estas **2 variables** (ambas son requeridas):

#### Variable 1: `NEXT_PUBLIC_SUPABASE_URL`
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://euxgrvunyghbpenkcgwh.supabase.co`
- **Environment:** Selecciona todas (Production, Preview, Development)

#### Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Tu clave anon de Supabase (la tienes en `.env.local`)
- **Environment:** Selecciona todas (Production, Preview, Development)

### Paso 3: Obtener el Anon Key

Si no tienes el `NEXT_PUBLIC_SUPABASE_ANON_KEY`, puedes obtenerlo:

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **Settings** → **API**
3. Copia la **anon/public** key
4. Pégala en Vercel como `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Paso 4: Redeploy

Después de agregar las variables:
1. Ve a **Deployments**
2. Haz clic en los **3 puntos** del último deploy
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo push a `main`

---

## 📋 Checklist

- [ ] Variable `NEXT_PUBLIC_SUPABASE_URL` agregada en Vercel
- [ ] Variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` agregada en Vercel
- [ ] Ambas variables configuradas para Production, Preview y Development
- [ ] Redeploy ejecutado
- [ ] Build exitoso sin errores

---

## 🔍 Verificar Variables Locales

Si necesitas verificar qué valores tienes localmente:

```bash
# Ver variables en .env.local
cat .env.local | grep NEXT_PUBLIC_SUPABASE
```

Deberías ver algo como:
```
NEXT_PUBLIC_SUPABASE_URL=https://euxgrvunyghbpenkcgwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**IMPORTANTE:** Copia estos mismos valores a Vercel.

---

## ✅ Después de Configurar

Una vez configuradas las variables y redeployado:
- ✅ El build debería completarse sin errores
- ✅ La app debería funcionar en producción
- ✅ No más errores de "URL and API key are required"

---

**Nota:** Las variables con prefijo `NEXT_PUBLIC_` son públicas y se exponen al cliente. Esto es normal y seguro para Supabase con RLS habilitado.

