# 🗑️ Storage Cleanup Checklist

## 📋 Overview

Después de ejecutar `RESET_ALL_BUSINESS_DATA.sql`, necesitas limpiar manualmente los archivos en Supabase Storage.

---

## 🪣 Bucket: `attachments`

Este bucket contiene todos los archivos subidos por la aplicación.

### Carpetas a limpiar:

#### 1. `inventory/`
- **Descripción:** Fotos de items de inventario
- **Campo en DB:** `inventory_items.photo_url`
- **Acción:** Eliminar todos los archivos en esta carpeta

#### 2. `maintenance/`
- **Descripción:** Fotos de tickets de mantenimiento
- **Campo en DB:** `maintenance_tickets.photo_url`
- **Acción:** Eliminar todos los archivos en esta carpeta

#### 3. `receipts/`
- **Descripción:** Recibos de gastos (PDFs, imágenes)
- **Campo en DB:** `expenses.receipt_url`
- **Acción:** Eliminar todos los archivos en esta carpeta

---

## 📝 Pasos Manuales en Supabase

### Opción 1: Eliminar por carpeta (Recomendado)

1. Ve a **Supabase Dashboard** → **Storage** → **attachments**
2. Para cada carpeta (`inventory/`, `maintenance/`, `receipts/`):
   - Click en la carpeta
   - Selecciona todos los archivos (checkbox superior)
   - Click en **Delete** (icono de basura)
   - Confirma la eliminación

### Opción 2: Eliminar bucket completo (Más rápido)

⚠️ **Solo si no usas el bucket para otra cosa:**

1. Ve a **Supabase Dashboard** → **Storage** → **attachments**
2. Click en **Settings** (engranaje)
3. Click en **Delete bucket**
4. Confirma la eliminación
5. **Recrea el bucket** después:
   - Name: `attachments`
   - Public: OFF (private)
   - File size limit: 10MB
   - Allowed MIME types: `image/jpeg, image/png, image/jpg, application/pdf`

---

## ✅ Checklist

### Pre-Limpieza:
- [ ] Ejecutado `RESET_ALL_BUSINESS_DATA.sql` en SQL Editor
- [ ] Verificado que todas las tablas están en 0 registros
- [ ] Backup de archivos importantes (si aplica)

### Limpieza Storage:
- [ ] Eliminados archivos en `attachments/inventory/`
- [ ] Eliminados archivos en `attachments/maintenance/`
- [ ] Eliminados archivos en `attachments/receipts/`
- [ ] Verificado que el bucket está vacío (o solo tiene estructura)

### Post-Limpieza:
- [ ] Verificado que la app funciona correctamente
- [ ] Probado upload de nuevo archivo (debe funcionar)
- [ ] Confirmado que no hay referencias rotas en la app

---

## 🔍 Verificación

### Verificar archivos restantes:

En Supabase Dashboard → Storage → attachments:
- Debe estar vacío o solo tener estructura de carpetas
- No debe haber archivos en `inventory/`, `maintenance/`, `receipts/`

### Verificar en código:

Los campos `photo_url` y `receipt_url` en la base de datos ahora apuntan a URLs que no existen. Esto es normal y no causa errores:
- La app simplemente no mostrará las imágenes
- Nuevos uploads funcionarán normalmente

---

## 📊 Estructura del Bucket

```
attachments/
├── inventory/          ← ELIMINAR TODO
│   ├── 0.123456.jpg
│   ├── 0.789012.png
│   └── ...
├── maintenance/        ← ELIMINAR TODO
│   ├── 0.345678.jpg
│   └── ...
└── receipts/           ← ELIMINAR TODO
    ├── 0.901234.pdf
    ├── 0.567890.jpg
    └── ...
```

**Después de limpieza:**
```
attachments/
├── inventory/          ← VACÍO
├── maintenance/        ← VACÍO
└── receipts/           ← VACÍO
```

---

## ⚠️ Notas Importantes

### No eliminar:
- ❌ El bucket `attachments` mismo (solo los archivos dentro)
- ❌ Las carpetas (estructura puede quedarse)
- ❌ Otros buckets si existen

### Si eliminas el bucket completo:
- Debes recrearlo con las mismas configuraciones
- Debes recrear las políticas RLS para Storage
- La app necesita el bucket para nuevos uploads

---

## 🚀 Script Alternativo (Futuro)

Si quieres automatizar la limpieza de Storage, puedes usar la API de Supabase:

```typescript
// Ejemplo (no incluido en el script SQL)
const { data, error } = await supabase.storage
  .from('attachments')
  .remove(['inventory/', 'maintenance/', 'receipts/'])
```

Pero por ahora, la limpieza manual es más segura y te da control total.

---

**Última actualización:** Enero 2025

