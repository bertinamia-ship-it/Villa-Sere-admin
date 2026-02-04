-- ============================================================
-- Properties Migration - Multi-Property Support
-- ============================================================
-- This migration adds multi-property support to CasaPilot
-- Each tenant can have multiple properties (villas/houses)
-- Business data is isolated by tenant_id + property_id
-- ============================================================

-- Step 1: Create properties table
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

-- Step 2: Add preferred_property_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Step 3: Add property_id to business tables (NOT vendors - vendors are shared)
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.maintenance_tickets 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE;

-- Note: vendors does NOT get property_id (shared across properties in tenant)

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON public.properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_id ON public.properties(id);
CREATE INDEX IF NOT EXISTS idx_expenses_property_id ON public.expenses(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_property_id ON public.maintenance_tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_property_id ON public.purchase_items(property_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_property_id ON public.inventory_items(property_id);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_property_id ON public.profiles(preferred_property_id);

-- Step 5: Enable RLS on properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies for Properties table
DROP POLICY IF EXISTS "Users can view properties in their tenant" ON public.properties;
CREATE POLICY "Users can view properties in their tenant"
  ON public.properties FOR SELECT
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create properties in their tenant" ON public.properties;
CREATE POLICY "Users can create properties in their tenant"
  ON public.properties FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update properties in their tenant" ON public.properties;
CREATE POLICY "Users can update properties in their tenant"
  ON public.properties FOR UPDATE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete properties in their tenant" ON public.properties;
CREATE POLICY "Users can delete properties in their tenant"
  ON public.properties FOR DELETE
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Step 7: Update RLS Policies for business tables (add property_id check)
-- These policies now check BOTH tenant_id AND property_id

-- Expenses policies (tenant + property isolation)
DROP POLICY IF EXISTS "Users can view expenses in their tenant" ON public.expenses;
CREATE POLICY "Users can view expenses in their tenant"
  ON public.expenses FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create expenses in their tenant" ON public.expenses;
CREATE POLICY "Users can create expenses in their tenant"
  ON public.expenses FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update expenses in their tenant" ON public.expenses;
CREATE POLICY "Users can update expenses in their tenant"
  ON public.expenses FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete expenses in their tenant" ON public.expenses;
CREATE POLICY "Users can delete expenses in their tenant"
  ON public.expenses FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

-- Maintenance tickets policies (tenant + property isolation)
DROP POLICY IF EXISTS "Users can view tickets in their tenant" ON public.maintenance_tickets;
CREATE POLICY "Users can view tickets in their tenant"
  ON public.maintenance_tickets FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create tickets in their tenant" ON public.maintenance_tickets;
CREATE POLICY "Users can create tickets in their tenant"
  ON public.maintenance_tickets FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update tickets in their tenant" ON public.maintenance_tickets;
CREATE POLICY "Users can update tickets in their tenant"
  ON public.maintenance_tickets FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete tickets in their tenant" ON public.maintenance_tickets;
CREATE POLICY "Users can delete tickets in their tenant"
  ON public.maintenance_tickets FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

-- Bookings policies (tenant + property isolation)
DROP POLICY IF EXISTS "Users can view bookings in their tenant" ON public.bookings;
CREATE POLICY "Users can view bookings in their tenant"
  ON public.bookings FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create bookings in their tenant" ON public.bookings;
CREATE POLICY "Users can create bookings in their tenant"
  ON public.bookings FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update bookings in their tenant" ON public.bookings;
CREATE POLICY "Users can update bookings in their tenant"
  ON public.bookings FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete bookings in their tenant" ON public.bookings;
CREATE POLICY "Users can delete bookings in their tenant"
  ON public.bookings FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

-- Purchase items policies (tenant + property isolation)
DROP POLICY IF EXISTS "Users can view purchase items in their tenant" ON public.purchase_items;
CREATE POLICY "Users can view purchase items in their tenant"
  ON public.purchase_items FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create purchase items in their tenant" ON public.purchase_items;
CREATE POLICY "Users can create purchase items in their tenant"
  ON public.purchase_items FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update purchase items in their tenant" ON public.purchase_items;
CREATE POLICY "Users can update purchase items in their tenant"
  ON public.purchase_items FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete purchase items in their tenant" ON public.purchase_items;
CREATE POLICY "Users can delete purchase items in their tenant"
  ON public.purchase_items FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

-- Inventory items policies (tenant + property isolation)
DROP POLICY IF EXISTS "Users can view inventory in their tenant" ON public.inventory_items;
CREATE POLICY "Users can view inventory in their tenant"
  ON public.inventory_items FOR SELECT
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can create inventory in their tenant" ON public.inventory_items;
CREATE POLICY "Users can create inventory in their tenant"
  ON public.inventory_items FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update inventory in their tenant" ON public.inventory_items;
CREATE POLICY "Users can update inventory in their tenant"
  ON public.inventory_items FOR UPDATE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete inventory in their tenant" ON public.inventory_items;
CREATE POLICY "Users can delete inventory in their tenant"
  ON public.inventory_items FOR DELETE
  USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
    AND property_id IN (SELECT id FROM public.properties WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  );

-- Note: Vendors policies remain unchanged (only tenant_id, no property_id)
-- Vendors are shared across all properties in a tenant

-- Step 8: Add updated_at trigger for properties (if function exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_updated_at') THEN
    DROP TRIGGER IF EXISTS set_properties_updated_at ON public.properties;
    CREATE TRIGGER set_properties_updated_at
      BEFORE UPDATE ON public.properties
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next steps:
-- 1. Update application code to use property_id in queries
-- 2. Create PropertySelector component
-- 3. Update all business table queries to filter by property_id
-- ============================================================


