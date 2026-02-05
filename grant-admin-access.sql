-- ============================================================
-- Grant Admin Access to condecorporation@gmail.com
-- ============================================================
-- This script grants unlimited property creation rights to the specified account
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Find the user ID for condecorporation@gmail.com
DO $$
DECLARE
  target_user_id UUID;
  target_tenant_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'condecorporation@gmail.com';

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email condecorporation@gmail.com not found';
  END IF;

  -- Get tenant_id from profile
  SELECT tenant_id INTO target_tenant_id
  FROM public.profiles
  WHERE id = target_user_id;

  IF target_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found or missing tenant_id';
  END IF;

  -- Update tenant to premium plan with active status
  UPDATE public.tenants
  SET 
    subscription_plan = 'premium',
    subscription_status = 'active',
    trial_ends_at = NULL,
    updated_at = now()
  WHERE id = target_tenant_id;

  RAISE NOTICE 'Successfully updated tenant for condecorporation@gmail.com';
  RAISE NOTICE 'User ID: %', target_user_id;
  RAISE NOTICE 'Tenant ID: %', target_tenant_id;
  RAISE NOTICE 'Subscription: premium, active';
END $$;

-- Verify the update
SELECT 
  u.email,
  t.subscription_plan,
  t.subscription_status,
  t.trial_ends_at,
  COUNT(p.id) as property_count
FROM auth.users u
JOIN public.profiles pr ON pr.id = u.id
JOIN public.tenants t ON t.id = pr.tenant_id
LEFT JOIN public.properties p ON p.tenant_id = t.id
WHERE u.email = 'condecorporation@gmail.com'
GROUP BY u.email, t.subscription_plan, t.subscription_status, t.trial_ends_at;

