-- ============================================================
-- Multi-Tenant Migration - Villa Management SaaS
-- ============================================================
-- This migration transforms the app from single-tenant to multi-tenant SaaS
-- Each user/organization gets isolated data via tenant_id
-- ============================================================

-- Step 1: Create tenants table (organizations)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb, -- Flexible settings storage
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Step 2: Add tenant_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Step 3: Add tenant_id to all data tables
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_tickets 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendors_tenant_id ON public.vendors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant_id ON public.inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_tenant_id ON public.maintenance_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_id ON public.expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_tenant_id ON public.purchase_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- Step 5: Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Step 6: Update RLS Policies for Multi-Tenant Isolation

-- Tenants policies
CREATE POLICY "Users can view their own tenants"
  ON public.tenants FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own tenants"
  ON public.tenants FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own tenants"
  ON public.tenants FOR UPDATE
  USING (owner_id = auth.uid());

-- Profiles policies (updated for tenant isolation)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid() OR 
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update profiles in their tenant"
  ON public.profiles FOR UPDATE
  USING (
    id = auth.uid() OR 
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- Vendors policies (tenant isolation)
DROP POLICY IF EXISTS "Anyone authenticated can view vendors" ON public.vendors;
CREATE POLICY "Users can view vendors in their tenant"
  ON public.vendors FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create vendors" ON public.vendors;
CREATE POLICY "Users can create vendors in their tenant"
  ON public.vendors FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update vendors" ON public.vendors;
CREATE POLICY "Users can update vendors in their tenant"
  ON public.vendors FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete vendors" ON public.vendors;
CREATE POLICY "Users can delete vendors in their tenant"
  ON public.vendors FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Inventory items policies (tenant isolation)
DROP POLICY IF EXISTS "Anyone authenticated can view inventory" ON public.inventory_items;
CREATE POLICY "Users can view inventory in their tenant"
  ON public.inventory_items FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create inventory items" ON public.inventory_items;
CREATE POLICY "Users can create inventory in their tenant"
  ON public.inventory_items FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update inventory items" ON public.inventory_items;
CREATE POLICY "Users can update inventory in their tenant"
  ON public.inventory_items FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete inventory items" ON public.inventory_items;
CREATE POLICY "Users can delete inventory in their tenant"
  ON public.inventory_items FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Maintenance tickets policies (tenant isolation)
DROP POLICY IF EXISTS "Anyone authenticated can view tickets" ON public.maintenance_tickets;
CREATE POLICY "Users can view tickets in their tenant"
  ON public.maintenance_tickets FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create tickets" ON public.maintenance_tickets;
CREATE POLICY "Users can create tickets in their tenant"
  ON public.maintenance_tickets FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update tickets" ON public.maintenance_tickets;
CREATE POLICY "Users can update tickets in their tenant"
  ON public.maintenance_tickets FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON public.maintenance_tickets;
CREATE POLICY "Users can delete tickets in their tenant"
  ON public.maintenance_tickets FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Expenses policies (tenant isolation)
DROP POLICY IF EXISTS "Anyone authenticated can view expenses" ON public.expenses;
CREATE POLICY "Users can view expenses in their tenant"
  ON public.expenses FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create expenses" ON public.expenses;
CREATE POLICY "Users can create expenses in their tenant"
  ON public.expenses FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
CREATE POLICY "Users can update expenses in their tenant"
  ON public.expenses FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
CREATE POLICY "Users can delete expenses in their tenant"
  ON public.expenses FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Bookings policies (tenant isolation)
DROP POLICY IF EXISTS "Anyone authenticated can view bookings" ON public.bookings;
CREATE POLICY "Users can view bookings in their tenant"
  ON public.bookings FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Users can create bookings in their tenant"
  ON public.bookings FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can update bookings" ON public.bookings;
CREATE POLICY "Users can update bookings in their tenant"
  ON public.bookings FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON public.bookings;
CREATE POLICY "Users can delete bookings in their tenant"
  ON public.bookings FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Purchase items policies (tenant isolation)
DROP POLICY IF EXISTS "Allow authenticated users to view purchase items" ON public.purchase_items;
CREATE POLICY "Users can view purchase items in their tenant"
  ON public.purchase_items FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to insert purchase items" ON public.purchase_items;
CREATE POLICY "Users can create purchase items in their tenant"
  ON public.purchase_items FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to update purchase items" ON public.purchase_items;
CREATE POLICY "Users can update purchase items in their tenant"
  ON public.purchase_items FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Allow authenticated users to delete purchase items" ON public.purchase_items;
CREATE POLICY "Users can delete purchase items in their tenant"
  ON public.purchase_items FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Step 7: Update handle_new_user function to create tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  tenant_slug TEXT;
BEGIN
  -- Generate tenant slug from email (before @)
  tenant_slug := lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '-', 'g'));
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = tenant_slug) LOOP
    tenant_slug := tenant_slug || '-' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Create tenant/organization
  INSERT INTO public.tenants (name, slug, owner_id, subscription_status, subscription_plan)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'full_name', 'My Villa'),
    tenant_slug,
    new.id,
    'trial',
    'free'
  )
  RETURNING id INTO new_tenant_id;
  
  -- Create profile with tenant_id
  INSERT INTO public.profiles (id, email, full_name, role, tenant_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'admin', -- First user is admin of their tenant
    new_tenant_id
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Add updated_at trigger for tenants
CREATE TRIGGER set_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 9: Make tenant_id NOT NULL after migration (optional, can be done later)
-- For now, we'll allow NULL during migration period
-- ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE public.vendors ALTER COLUMN tenant_id SET NOT NULL;
-- ... (repeat for all tables)

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next steps:
-- 1. Run data migration script to assign existing data to tenants
-- 2. Update application code to use tenant_id in all queries
-- 3. Remove hardcoded "Villa Serena" references
-- 4. Test multi-tenant isolation
-- ============================================================


