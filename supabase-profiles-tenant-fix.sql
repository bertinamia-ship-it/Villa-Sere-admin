-- ============================================================
-- Profiles Tenant Fix - Add Missing Columns
-- ============================================================
-- This migration adds tenant_id and preferred_property_id to profiles
-- and ensures all existing profiles have tenant_id set
-- ============================================================

-- Step 1: Add tenant_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 2: Add preferred_property_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_property_id UUID;

-- Step 3: Add foreign key constraint for tenant_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_tenant_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_tenant_id_fkey 
    FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Add foreign key constraint for preferred_property_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_preferred_property_id_fkey'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_preferred_property_id_fkey 
    FOREIGN KEY (preferred_property_id) 
    REFERENCES public.properties(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_property_id ON public.profiles(preferred_property_id);

-- Step 6: Backfill tenant_id for existing profiles
-- Match profiles to tenants where tenant.owner_id = profiles.id
UPDATE public.profiles p
SET tenant_id = t.id
FROM public.tenants t
WHERE t.owner_id = p.id
  AND p.tenant_id IS NULL;

-- Step 7: Update handle_new_user() function to ensure profile has tenant_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  tenant_slug TEXT;
  existing_profile RECORD;
BEGIN
  -- Generate tenant slug from email (before @)
  tenant_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_slug) LOOP
    tenant_slug := tenant_slug || '-' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Create tenant/organization with 14-day trial
  INSERT INTO public.tenants (name, slug, owner_id, subscription_status, subscription_plan, trial_ends_at)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'full_name', 'My Villa'),
    tenant_slug,
    new.id,
    'trial',
    'free',
    NOW() + INTERVAL '14 days' -- 14-day trial
  )
  RETURNING id INTO new_tenant_id;
  
  -- Check if profile already exists (shouldn't happen, but handle it)
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE id = new.id;
  
  IF FOUND THEN
    -- Profile exists: update tenant_id if it's null
    UPDATE public.profiles
    SET tenant_id = new_tenant_id
    WHERE id = new.id
      AND tenant_id IS NULL;
  ELSE
    -- Create profile with tenant_id
    INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
    VALUES (
      new.id,
      new.email,
      new.raw_user_meta_data->>'full_name',
      'admin', -- First user is admin of their tenant
      new_tenant_id
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Ensure all existing profiles without tenant_id get one
-- This handles edge cases where profile exists but tenant_id is null
DO $$
DECLARE
  profile_record RECORD;
  tenant_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, email FROM public.profiles WHERE tenant_id IS NULL
  LOOP
    -- Try to find tenant by owner_id
    SELECT * INTO tenant_record
    FROM public.tenants
    WHERE owner_id = profile_record.id
    LIMIT 1;
    
    IF FOUND THEN
      -- Update profile with tenant_id
      UPDATE public.profiles
      SET tenant_id = tenant_record.id
      WHERE id = profile_record.id;
    ELSE
      -- No tenant found: create one for this profile
      INSERT INTO public.tenants (name, slug, owner_id, subscription_status, subscription_plan, trial_ends_at)
      VALUES (
        COALESCE(profile_record.email, 'My Villa'),
        lower(regexp_replace(split_part(profile_record.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || floor(random() * 10000)::text,
        profile_record.id,
        'trial',
        'free',
        NOW() + INTERVAL '14 days'
      )
      RETURNING id INTO tenant_record.id;
      
      -- Update profile with new tenant_id
      UPDATE public.profiles
      SET tenant_id = tenant_record.id
      WHERE id = profile_record.id;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Query 1: Verify all profiles have tenant_id
-- Expected: All rows should have tenant_id NOT NULL
SELECT 
  COUNT(*) as total_profiles,
  COUNT(tenant_id) as profiles_with_tenant_id,
  COUNT(*) - COUNT(tenant_id) as profiles_without_tenant_id
FROM public.profiles;

-- Query 2: Verify foreign key relationships
-- Expected: All tenant_id values should exist in tenants table
SELECT 
  p.id as profile_id,
  p.email,
  p.tenant_id,
  CASE 
    WHEN t.id IS NOT NULL THEN '✅ Valid'
    WHEN p.tenant_id IS NULL THEN '⚠️ NULL'
    ELSE '❌ Invalid FK'
  END as tenant_status
FROM public.profiles p
LEFT JOIN public.tenants t ON p.tenant_id = t.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next steps:
-- 1. Run verification queries above
-- 2. Test Create Property in app
-- 3. Verify preferred_property_id is set when property is created
-- ============================================================


