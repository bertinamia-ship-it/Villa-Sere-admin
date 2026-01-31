-- ============================================================
-- RESET ALL BUSINESS DATA - Auto-Detect & Truncate
-- ============================================================
-- ⚠️  WARNING: This script will DELETE ALL BUSINESS DATA
-- 
-- What it does:
-- - Auto-detects all business tables (with tenant_id or FKs to tenants/profiles)
-- - TRUNCATE all detected business tables
-- - Resets sequences
-- - Preserves: schema, RLS, functions, triggers, tenants, profiles, auth.users
--
-- Auto-detection criteria:
-- ✅ Tables with tenant_id column
-- ✅ Tables with FK to tenants table
-- ✅ Tables with FK to profiles table (except profiles itself)
-- ❌ Excludes: tenants, profiles, auth.users, system tables
--
-- ============================================================

BEGIN;

-- ============================================================
-- Step 1: Auto-detect business tables
-- ============================================================
-- Find all tables that should be truncated:
-- 1. Tables with tenant_id column
-- 2. Tables with FK to tenants
-- 3. Tables with FK to profiles (except profiles itself)

DO $$
DECLARE
  v_table TEXT;
  table_list TEXT[] := ARRAY[]::TEXT[];
  truncate_sql TEXT;
BEGIN
  -- Find tables with tenant_id column
  FOR v_table IN
    SELECT t.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT IN ('tenants', 'profiles')
  LOOP
    table_list := array_append(table_list, 'public.' || v_table);
  END LOOP;

  -- Find tables with FK to tenants
  FOR v_table IN
    SELECT DISTINCT tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'tenants'
      AND tc.table_name NOT IN ('tenants', 'profiles')
  LOOP
    -- Add if not already in list (check without 'public.' prefix)
    IF NOT ('public.' || v_table = ANY(table_list)) THEN
      table_list := array_append(table_list, 'public.' || v_table);
    END IF;
  END LOOP;

  -- Find tables with FK to profiles (except profiles itself)
  FOR v_table IN
    SELECT DISTINCT tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = 'profiles'
      AND tc.table_name != 'profiles'
      AND tc.table_name NOT IN ('tenants')
  LOOP
    -- Add if not already in list (check without 'public.' prefix)
    IF NOT ('public.' || v_table = ANY(table_list)) THEN
      table_list := array_append(table_list, 'public.' || v_table);
    END IF;
  END LOOP;

  -- Also include known business tables (fallback if detection misses any)
  -- These are tables we know should be truncated
  FOR v_table IN
    SELECT unnest(ARRAY[
      'expenses',
      'maintenance_tickets',
      'bookings',
      'purchase_items',
      'inventory_items',
      'vendors'
    ])
  LOOP
    IF NOT ('public.' || v_table = ANY(table_list)) THEN
      -- Check if table exists (use alias to avoid ambiguity)
      IF EXISTS (
        SELECT 1 
        FROM information_schema.tables it
        WHERE it.table_schema = 'public' 
          AND it.table_name = v_table
      ) THEN
        table_list := array_append(table_list, 'public.' || v_table);
      END IF;
    END IF;
  END LOOP;

  -- Log detected tables
  RAISE NOTICE 'Detected business tables to truncate:';
  FOREACH v_table IN ARRAY table_list
  LOOP
    RAISE NOTICE '  - %', v_table;
  END LOOP;

  -- Build and execute TRUNCATE statement
  IF array_length(table_list, 1) > 0 THEN
    truncate_sql := 'TRUNCATE TABLE ' || array_to_string(table_list, ', ') || ' CASCADE';
    RAISE NOTICE 'Executing: %', truncate_sql;
    EXECUTE truncate_sql;
    RAISE NOTICE '✅ All business tables truncated';
  ELSE
    RAISE NOTICE '⚠️  No business tables detected';
  END IF;
END $$;

-- ============================================================
-- Step 2: Reset sequences (if they exist)
-- ============================================================
-- Reset all sequences in public schema (safe to run even if they don't exist)

DO $$
DECLARE
  seq_name TEXT;
BEGIN
  FOR seq_name IN
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    BEGIN
      EXECUTE 'ALTER SEQUENCE public.' || quote_ident(seq_name) || ' RESTART WITH 1';
      RAISE NOTICE 'Reset sequence: %', seq_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not reset sequence: % (may not exist)', seq_name;
    END;
  END LOOP;
END $$;

-- ============================================================
-- Step 3: Verify deletion (show counts)
-- ============================================================

DO $$
DECLARE
  v_table TEXT;
  row_count INTEGER;
  total_tables INTEGER := 0;
  total_rows INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification - Row counts after reset:';
  RAISE NOTICE '========================================';

  -- Check all tables in public schema
  FOR v_table IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT IN ('tenants', 'profiles')
    ORDER BY t.table_name
  LOOP
    BEGIN
      EXECUTE 'SELECT COUNT(*) FROM public.' || quote_ident(v_table) INTO row_count;
      
      IF row_count > 0 THEN
        RAISE NOTICE '  %: % rows ⚠️', v_table, row_count;
        total_rows := total_rows + row_count;
      ELSE
        RAISE NOTICE '  %: 0 rows ✅', v_table;
      END IF;
      
      total_tables := total_tables + 1;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '  %: Could not check (may not exist)', v_table;
    END;
  END LOOP;

  RAISE NOTICE '========================================';
  IF total_rows = 0 THEN
    RAISE NOTICE '✅ All business data deleted successfully';
    RAISE NOTICE '   Checked % tables, all empty', total_tables;
  ELSE
    RAISE WARNING '⚠️  Some tables still have data (% total rows)', total_rows;
  END IF;
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- ============================================================
-- Reset Complete
-- ============================================================
-- All detected business data has been deleted.
-- Schema, RLS policies, functions, and triggers remain intact.
-- Tenants and profiles are preserved (organizations remain).
--
-- Next steps:
-- 1. Clean Storage manually (see STORAGE_CLEANUP_CHECKLIST.md)
-- 2. New signups will create tenants with empty data
-- 3. Existing tenants will have empty business data
-- ============================================================

