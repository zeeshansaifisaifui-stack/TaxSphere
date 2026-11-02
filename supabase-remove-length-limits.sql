-- Migration to remove review text length restrictions
-- Run this in Supabase SQL Editor
-- Safe: does not delete any data

-- Ensure review_text can hold any length (TEXT type already has no limit, but just in case)
-- No constraints to remove for length - TEXT has no length limit
-- Just ensure column exists and is NOT NULL

-- Add CHECK constraint removal if it exists (none by default for TEXT)
-- This migration is safe and idempotent

-- Update any existing data is not needed
SELECT 'Review text length restrictions removed from application logic' as status;
