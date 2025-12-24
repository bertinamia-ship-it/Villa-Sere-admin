-- Fix maintenance_tickets table for Excel import
-- Make room nullable with default 'General'
-- Add description column if it doesn't exist

-- Step 1: Make room column nullable and set default
ALTER TABLE public.maintenance_tickets 
ALTER COLUMN room DROP NOT NULL,
ALTER COLUMN room SET DEFAULT 'General';

-- Step 2: Add description column if it doesn't exist
ALTER TABLE public.maintenance_tickets 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify the table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'maintenance_tickets' AND table_schema = 'public';
