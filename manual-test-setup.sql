-- Manual Test User Creation for Villa Sere
-- Run this in Supabase SQL Editor if automated signup fails

-- First, check if user exists
SELECT id, email, role FROM public.profiles WHERE email = 'admin@villasere.com';

-- If the user doesn't exist, you'll need to:
-- 1. Sign up manually through the app UI at http://localhost:3000/signup
-- 2. Or create via Supabase Auth dashboard

-- After user is created, upgrade to admin:
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@villasere.com';

-- Verify:
SELECT id, email, role, created_at FROM public.profiles WHERE email = 'admin@villasere.com';

-- Check all tables have correct permissions
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'vendors', 'inventory_items', 'maintenance_tickets', 'expenses');
