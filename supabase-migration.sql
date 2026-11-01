-- Safe migration for existing TaxSphere reviews table
-- Run this in your Supabase SQL Editor BEFORE deploying
-- This preserves all existing data

-- Step 1: Add missing columns
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Migrate existing data from 'message' to 'review_text'
UPDATE public.reviews 
SET review_text = message 
WHERE review_text IS NULL AND message IS NOT NULL;

-- Step 3: Make review_text NOT NULL after migration (if all rows have data)
-- Check for nulls first
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reviews WHERE review_text IS NULL) THEN
    ALTER TABLE public.reviews ALTER COLUMN review_text SET NOT NULL;
  END IF;
END $$;

-- Step 4: Add indexes
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Step 5: Enable RLS if not already enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Anyone can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;

-- Policy: Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews" ON public.reviews
  FOR SELECT USING (approved = true);

-- Policy: Anyone can insert reviews (pending approval)
CREATE POLICY "Anyone can insert reviews" ON public.reviews
  FOR INSERT WITH CHECK (true);

-- Step 7: Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Optional - keep 'message' column for backward compatibility or drop it
-- Uncomment the line below only if you're sure you don't need the old column
-- ALTER TABLE public.reviews DROP COLUMN IF EXISTS message;
