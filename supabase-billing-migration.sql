-- ============================================================
-- Billing & Subscription Management
-- ============================================================
-- Adds trial management and subscription status checks
-- ============================================================

-- Step 1: Add trial_ends_at to tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Step 2: Update subscription_status enum to include 'past_due'
-- Note: PostgreSQL doesn't support ALTER TYPE easily, so we'll use a workaround
DO $$
BEGIN
  -- Check if constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'tenants_subscription_status_check'
  ) THEN
    ALTER TABLE public.tenants DROP CONSTRAINT tenants_subscription_status_check;
  END IF;
  
  -- Add new constraint with updated values
  ALTER TABLE public.tenants 
  ADD CONSTRAINT tenants_subscription_status_check 
  CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'));
END $$;

-- Step 3: Set trial_ends_at for existing tenants without it (14 days from creation)
UPDATE public.tenants
SET trial_ends_at = created_at + INTERVAL '14 days'
WHERE trial_ends_at IS NULL AND subscription_status = 'trial';

-- Step 4: Function to check if tenant subscription is active
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

-- Step 5: Update handle_new_user to set trial_ends_at (14 days)
-- Note: This replaces the existing handle_new_user function
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

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_trial_ends_at ON public.tenants(trial_ends_at);

-- ============================================================
-- Migration Complete
-- ============================================================
-- Next steps:
-- 1. Update app code to check subscription status
-- 2. Add billing page
-- 3. Add subscription guards
-- ============================================================

