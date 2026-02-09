-- Script para testing: Limpiar datos de onboarding
-- Uso: Ejecutar en Supabase SQL Editor para limpiar datos de un usuario y probar onboarding

-- IMPORTANTE: Reemplazar 'TU_EMAIL_AQUI@ejemplo.com' con el email del usuario a testear

-- Paso 1: Obtener tenant_id y property_id del usuario
DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  -- Obtener user_id y tenant_id
  SELECT id, tenant_id INTO v_user_id, v_tenant_id
  FROM public.profiles
  WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Eliminar todas las propiedades del tenant (esto eliminará en cascada expenses, accounts, etc.)
  DELETE FROM public.properties
  WHERE tenant_id = v_tenant_id;

  -- Limpiar localStorage (esto debe hacerse manualmente en el navegador)
  -- localStorage.removeItem('activePropertyId');

  RAISE NOTICE 'Datos limpiados para tenant: %', v_tenant_id;
END $$;

-- Verificar que no hay propiedades
SELECT 
  p.email,
  COUNT(prop.id) as property_count
FROM public.profiles p
LEFT JOIN public.properties prop ON prop.tenant_id = p.tenant_id
WHERE p.email = 'TU_EMAIL_AQUI@ejemplo.com'
GROUP BY p.email;

