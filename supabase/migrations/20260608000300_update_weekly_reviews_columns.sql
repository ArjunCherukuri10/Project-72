-- Add missing columns to weekly_reviews table to support dashboard reviews saving
ALTER TABLE public.weekly_reviews
ADD COLUMN IF NOT EXISTS avg_compliance_score INTEGER,
ADD COLUMN IF NOT EXISTS avg_calories INTEGER,
ADD COLUMN IF NOT EXISTS avg_protein INTEGER,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS highlights TEXT[],
ADD COLUMN IF NOT EXISTS lowlights TEXT[],
ADD COLUMN IF NOT EXISTS next_actions TEXT[];
