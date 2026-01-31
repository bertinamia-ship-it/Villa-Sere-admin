-- ============================================================
-- SUPABASE BOOTSTRAP - Multi-Tenant + Multi-Property
-- ============================================================
-- This script creates the complete multi-tenant architecture from scratch
-- Idempotent: safe to run multiple times
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Step 1: Create tenants table (organizations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for tenants
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON public.tenants(trial_ends_at);

-- ============================================================
-- Step 2: Ensure profiles table exists and add columns
-- ============================================================
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')) DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add tenant_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN tenant_id UUID;
  END IF;
END $$;

-- Add preferred_property_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'preferred_property_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_property_id UUID;
  END IF;
END $$;

-- Add foreign key for tenant_id
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

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_property_id ON public.profiles(preferred_property_id);

-- ============================================================
-- Step 3: Create properties table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  photo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON public.properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_id ON public.properties(id);

-- Add foreign key for preferred_property_id (after properties table exists)
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

-- ============================================================
-- Step 4: Add tenant_id and property_id to business tables
-- ============================================================

-- Function to add column if table exists
CREATE OR REPLACE FUNCTION add_column_if_table_exists(
  table_name TEXT,
  column_name TEXT,
  column_type TEXT,
  default_value TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = add_column_if_table_exists.table_name
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = add_column_if_table_exists.table_name
      AND column_name = add_column_if_table_exists.column_name
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN %I %s %s',
        add_column_if_table_exists.table_name,
        add_column_if_table_exists.column_name,
        add_column_if_table_exists.column_type,
        COALESCE('DEFAULT ' || default_value, '')
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add tenant_id to business tables (if they exist)
SELECT add_column_if_table_exists('vendors', 'tenant_id', 'UUID');
SELECT add_column_if_table_exists('expenses', 'tenant_id', 'UUID');
SELECT add_column_if_table_exists('maintenance_tickets', 'tenant_id', 'UUID');
SELECT add_column_if_table_exists('bookings', 'tenant_id', 'UUID');
SELECT add_column_if_table_exists('purchase_items', 'tenant_id', 'UUID');
SELECT add_column_if_table_exists('inventory_items', 'tenant_id', 'UUID');

-- Add property_id to business tables (if they exist) - vendors does NOT get property_id
SELECT add_column_if_table_exists('expenses', 'property_id', 'UUID');
SELECT add_column_if_table_exists('maintenance_tickets', 'property_id', 'UUID');
SELECT add_column_if_table_exists('bookings', 'property_id', 'UUID');
SELECT add_column_if_table_exists('purchase_items', 'property_id', 'UUID');
SELECT add_column_if_table_exists('inventory_items', 'property_id', 'UUID');

-- Add foreign keys for tenant_id (if tables exist)
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['vendors', 'expenses', 'maintenance_tickets', 'bookings', 'purchase_items', 'inventory_items']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = table_name || '_tenant_id_fkey'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE',
          table_name,
          table_name || '_tenant_id_fkey'
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Add foreign keys for property_id (if tables exist) - vendors excluded
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['expenses', 'maintenance_tickets', 'bookings', 'purchase_items', 'inventory_items']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = table_name || '_property_id_fkey'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE',
          table_name,
          table_name || '_property_id_fkey'
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Create indexes for tenant_id and property_id (if tables exist)
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['vendors', 'expenses', 'maintenance_tickets', 'bookings', 'purchase_items', 'inventory_items']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON public.%I(tenant_id)',
        table_name, table_name
      );
    END IF;
  END LOOP;
  
  FOR table_name IN SELECT unnest(ARRAY['expenses', 'maintenance_tickets', 'bookings', 'purchase_items', 'inventory_items']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_property_id ON public.%I(property_id)',
        table_name, table_name
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Step 5: Create handle_new_user() function and trigger
-- ============================================================
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
  
  -- Check if profile already exists
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

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Step 6: Backfill existing data
-- ============================================================

-- Backfill tenant_id for existing profiles (match by owner_id)
UPDATE public.profiles p
SET tenant_id = t.id
FROM public.tenants t
WHERE t.owner_id = p.id
  AND p.tenant_id IS NULL;

-- Create tenants for profiles that don't have one
DO $$
DECLARE
  profile_record RECORD;
  new_tenant_id UUID;
  tenant_slug TEXT;
BEGIN
  FOR profile_record IN 
    SELECT id, email FROM public.profiles WHERE tenant_id IS NULL
  LOOP
    -- Generate unique slug
    tenant_slug := lower(regexp_replace(split_part(profile_record.email, '@', 1), '[^a-z0-9]', '-', 'g')) || '-' || floor(random() * 10000)::text;
    
    WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_slug) LOOP
      tenant_slug := tenant_slug || '-' || floor(random() * 10000)::text;
    END LOOP;
    
    -- Create tenant
    INSERT INTO public.tenants (name, slug, owner_id, subscription_status, subscription_plan, trial_ends_at)
    VALUES (
      COALESCE(profile_record.email, 'My Villa'),
      tenant_slug,
      profile_record.id,
      'trial',
      'free',
      NOW() + INTERVAL '14 days'
    )
    RETURNING id INTO new_tenant_id;
    
    -- Update profile with tenant_id
    UPDATE public.profiles
    SET tenant_id = new_tenant_id
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- ============================================================
-- Step 7: Enable RLS and create policies
-- ============================================================

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
CREATE POLICY "Users can view their own tenant"
  ON public.tenants FOR SELECT
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own tenant" ON public.tenants;
CREATE POLICY "Users can update their own tenant"
  ON public.tenants FOR UPDATE
  USING (owner_id = auth.uid());

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    OR id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies for properties
DROP POLICY IF EXISTS "Users can view properties in their tenant" ON public.properties;
CREATE POLICY "Users can view properties in their tenant"
  ON public.properties FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create properties in their tenant" ON public.properties;
CREATE POLICY "Users can create properties in their tenant"
  ON public.properties FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update properties in their tenant" ON public.properties;
CREATE POLICY "Users can update properties in their tenant"
  ON public.properties FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete properties in their tenant" ON public.properties;
CREATE POLICY "Users can delete properties in their tenant"
  ON public.properties FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- RLS Policies for business tables (if they exist)
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['vendors', 'expenses', 'maintenance_tickets', 'bookings', 'purchase_items', 'inventory_items']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      
      -- Drop existing policies if they exist
      EXECUTE format('DROP POLICY IF EXISTS "Users can view %I in their tenant" ON public.%I', table_name, table_name);
      EXECUTE format('DROP POLICY IF EXISTS "Users can create %I in their tenant" ON public.%I', table_name, table_name);
      EXECUTE format('DROP POLICY IF EXISTS "Users can update %I in their tenant" ON public.%I', table_name, table_name);
      EXECUTE format('DROP POLICY IF EXISTS "Users can delete %I in their tenant" ON public.%I', table_name, table_name);
      
      -- SELECT policy (tenant_id only for vendors, tenant_id + property_id for others)
      IF table_name = 'vendors' THEN
        EXECUTE format('CREATE POLICY "Users can view %I in their tenant" ON public.%I FOR SELECT USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))', table_name, table_name);
      ELSE
        EXECUTE format('CREATE POLICY "Users can view %I in their tenant" ON public.%I FOR SELECT USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())))', table_name, table_name);
      END IF;
      
      -- INSERT policy
      IF table_name = 'vendors' THEN
        EXECUTE format('CREATE POLICY "Users can create %I in their tenant" ON public.%I FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))', table_name, table_name);
      ELSE
        EXECUTE format('CREATE POLICY "Users can create %I in their tenant" ON public.%I FOR INSERT WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())))', table_name, table_name);
      END IF;
      
      -- UPDATE policy
      IF table_name = 'vendors' THEN
        EXECUTE format('CREATE POLICY "Users can update %I in their tenant" ON public.%I FOR UPDATE USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))', table_name, table_name);
      ELSE
        EXECUTE format('CREATE POLICY "Users can update %I in their tenant" ON public.%I FOR UPDATE USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())))', table_name, table_name);
      END IF;
      
      -- DELETE policy
      IF table_name = 'vendors' THEN
        EXECUTE format('CREATE POLICY "Users can delete %I in their tenant" ON public.%I FOR DELETE USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))', table_name, table_name);
      ELSE
        EXECUTE format('CREATE POLICY "Users can delete %I in their tenant" ON public.%I FOR DELETE USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()) AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())))', table_name, table_name);
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Step 8: Helper function for tenant active check
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_tenant_active(tenant_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  SELECT subscription_status, subscription_plan, trial_ends_at
  INTO tenant_record
  FROM public.tenants
  WHERE id = tenant_uuid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Active subscription
  IF tenant_record.subscription_status = 'active' THEN
    RETURN TRUE;
  END IF;
  
  -- Trial: check if not expired
  IF tenant_record.subscription_status = 'trial' THEN
    IF tenant_record.trial_ends_at IS NULL THEN
      RETURN TRUE; -- No expiration set, assume active
    END IF;
    RETURN tenant_record.trial_ends_at > NOW();
  END IF;
  
  -- All other statuses are inactive
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Step 9: Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN SELECT unnest(ARRAY['tenants', 'profiles', 'properties']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON public.%I', table_name, table_name);
      EXECUTE format('CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
        table_name, table_name
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Query 1: Verify tenants table exists and has data
SELECT 
  'tenants' as table_name,
  COUNT(*) as row_count
FROM public.tenants;

-- Query 2: Verify profiles have tenant_id
SELECT 
  COUNT(*) as total_profiles,
  COUNT(tenant_id) as profiles_with_tenant_id,
  COUNT(*) - COUNT(tenant_id) as profiles_without_tenant_id
FROM public.profiles;

-- Query 3: Verify properties table exists
SELECT 
  'properties' as table_name,
  COUNT(*) as row_count
FROM public.properties;

-- Query 4: Verify foreign key relationships
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

-- Query 5: List all business tables and their columns
SELECT 
  t.table_name,
  STRING_AGG(c.column_name, ', ' ORDER BY c.ordinal_position) as columns
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN ('vendors', 'expenses', 'maintenance_tickets', 'bookings', 'purchase_items', 'inventory_items')
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next steps:
-- 1. Run verification queries above
-- 2. Test Create Property in app
-- 3. Verify preferred_property_id is set when property is created
-- ============================================================

