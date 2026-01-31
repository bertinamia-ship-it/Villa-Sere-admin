-- ============================================================
-- RESET ALL DATA - Multi-Tenant Villa Management SaaS
-- ============================================================
-- ⚠️  WARNING: This script will DELETE ALL BUSINESS DATA
-- 
-- What it does:
-- - Deletes ALL data from business tables (inventory, bookings, etc.)
-- - Resets sequences/identities
-- - Preserves: schema, tables, RLS policies, functions, triggers
-- - Preserves: tenants, profiles, auth.users (organizations remain)
--
-- What gets deleted:
-- ✅ expenses
-- ✅ maintenance_tickets
-- ✅ bookings
-- ✅ purchase_items
-- ✅ inventory_items
-- ✅ vendors
--
-- What is preserved:
-- ✅ tenants (organizations)
-- ✅ profiles (user profiles)
-- ✅ auth.users (authentication)
-- ✅ Schema, RLS policies, functions, triggers
-- ✅ Storage bucket structure (files deleted separately if needed)
--
-- ============================================================

BEGIN;

-- ============================================================
-- Step 1: Truncate all business tables (CASCADE handles FKs)
-- ============================================================
-- Using TRUNCATE CASCADE for efficiency and FK handling
-- CASCADE automatically handles dependent tables

TRUNCATE TABLE 
  public.expenses,
  public.maintenance_tickets,
  public.bookings,
  public.purchase_items,
  public.inventory_items,
  public.vendors
CASCADE;

-- ============================================================
-- Step 2: Reset sequences (if they exist)
-- ============================================================
-- Note: UUID tables use gen_random_uuid(), so sequences may not exist
-- This is safe to run even if sequences don't exist

DO $$ 
BEGIN
  -- Reset expenses sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'expenses_id_seq') THEN
    ALTER SEQUENCE public.expenses_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset maintenance_tickets sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'maintenance_tickets_id_seq') THEN
    ALTER SEQUENCE public.maintenance_tickets_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset bookings sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bookings_id_seq') THEN
    ALTER SEQUENCE public.bookings_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset purchase_items sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'purchase_items_id_seq') THEN
    ALTER SEQUENCE public.purchase_items_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset inventory_items sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'inventory_items_id_seq') THEN
    ALTER SEQUENCE public.inventory_items_id_seq RESTART WITH 1;
  END IF;
  
  -- Reset vendors sequence
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'vendors_id_seq') THEN
    ALTER SEQUENCE public.vendors_id_seq RESTART WITH 1;
  END IF;
END $$;

-- ============================================================
-- Step 3: Verify deletion (optional - shows counts)
-- ============================================================

DO $$
DECLARE
  expenses_count INTEGER;
  tickets_count INTEGER;
  bookings_count INTEGER;
  purchase_items_count INTEGER;
  inventory_count INTEGER;
  vendors_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO expenses_count FROM public.expenses;
  SELECT COUNT(*) INTO tickets_count FROM public.maintenance_tickets;
  SELECT COUNT(*) INTO bookings_count FROM public.bookings;
  SELECT COUNT(*) INTO purchase_items_count FROM public.purchase_items;
  SELECT COUNT(*) INTO inventory_count FROM public.inventory_items;
  SELECT COUNT(*) INTO vendors_count FROM public.vendors;

  RAISE NOTICE 'Verification:';
  RAISE NOTICE '  expenses: % rows', expenses_count;
  RAISE NOTICE '  maintenance_tickets: % rows', tickets_count;
  RAISE NOTICE '  bookings: % rows', bookings_count;
  RAISE NOTICE '  purchase_items: % rows', purchase_items_count;
  RAISE NOTICE '  inventory_items: % rows', inventory_count;
  RAISE NOTICE '  vendors: % rows', vendors_count;
  
  IF expenses_count = 0 AND tickets_count = 0 AND bookings_count = 0 
     AND purchase_items_count = 0 AND inventory_count = 0 AND vendors_count = 0 THEN
    RAISE NOTICE '✅ All business data deleted successfully';
  ELSE
    RAISE WARNING '⚠️  Some tables still have data';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- Reset Complete
-- ============================================================
-- All business data has been deleted.
-- Schema, RLS policies, functions, and triggers remain intact.
-- Tenants and profiles are preserved (organizations remain).
--
-- Next steps:
-- 1. New signups will create tenants with empty data
-- 2. Existing tenants will have empty business data
-- 3. You can manually add data as needed
-- ============================================================

