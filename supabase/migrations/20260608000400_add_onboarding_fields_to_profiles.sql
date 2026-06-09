-- Alter profiles table to add missing onboarding goal fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS primary_goal TEXT DEFAULT 'Lose Weight',
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS recommended_date DATE,
ADD COLUMN IF NOT EXISTS recommended_weekly_change NUMERIC(5,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS recommended_deficit INTEGER DEFAULT 500;
