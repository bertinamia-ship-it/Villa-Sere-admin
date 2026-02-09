-- Script para testing: Expirar trial de un usuario
-- Uso: Ejecutar en Supabase SQL Editor para expirar el trial de un tenant específico

-- Opción 1: Expirar trial de un tenant específico por email del owner
UPDATE public.tenants
SET trial_ends_at = NOW() - INTERVAL '1 day'
WHERE id = (
  SELECT tenant_id 
  FROM public.profiles 
  WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
  LIMIT 1
);

-- Opción 2: Expirar trial de un tenant específico por ID
-- UPDATE public.tenants
-- SET trial_ends_at = NOW() - INTERVAL '1 day'
-- WHERE id = 'TENANT_ID_AQUI';

-- Opción 3: Restaurar trial (activar de nuevo para testing)
-- UPDATE public.tenants
-- SET trial_ends_at = NOW() + INTERVAL '7 days'
-- WHERE id = (
--   SELECT tenant_id 
--   FROM public.profiles 
--   WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
--   LIMIT 1
-- );

-- Verificar estado del trial
SELECT 
  t.id,
  t.name,
  t.subscription_status,
  t.trial_ends_at,
  CASE 
    WHEN t.trial_ends_at IS NULL THEN 'No expira'
    WHEN t.trial_ends_at > NOW() THEN 'Activo'
    ELSE 'Expirado'
  END as trial_status,
  p.email as owner_email
FROM public.tenants t
JOIN public.profiles p ON t.owner_id = p.id
WHERE p.email = 'TU_EMAIL_AQUI@ejemplo.com';

