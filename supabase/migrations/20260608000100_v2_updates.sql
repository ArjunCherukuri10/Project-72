-- Alter profiles table to add new onboarding/personalization columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS fitness_experience TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS workout_days_limit INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS workout_duration_limit INTEGER DEFAULT 45,
ADD COLUMN IF NOT EXISTS gym_access TEXT DEFAULT 'both',
ADD COLUMN IF NOT EXISTS diet_preference TEXT DEFAULT 'non_vegetarian',
ADD COLUMN IF NOT EXISTS foods_to_avoid TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS budget_preference TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Create goals table
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    primary_goal TEXT NOT NULL,
    target_weight NUMERIC(5,2),
    target_date DATE,
    recommended_date DATE,
    recommended_weekly_change NUMERIC(5,2),
    recommended_deficit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;
CREATE POLICY "Users can manage own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- Create nutrition_targets table
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    calories INTEGER NOT NULL,
    protein NUMERIC(5,2) NOT NULL,
    carbs NUMERIC(5,2) NOT NULL,
    fat NUMERIC(5,2) NOT NULL,
    fiber NUMERIC(5,2) NOT NULL,
    water_ml INTEGER NOT NULL DEFAULT 2500,
    steps INTEGER NOT NULL DEFAULT 10000,
    sleep_hours NUMERIC(4,2) NOT NULL DEFAULT 8.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own nutrition targets" ON public.nutrition_targets;
CREATE POLICY "Users can manage own nutrition targets" ON public.nutrition_targets
    FOR ALL USING (auth.uid() = user_id);

-- Create ai_workout_plans table
CREATE TABLE IF NOT EXISTS public.ai_workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    split_name TEXT NOT NULL,
    weekly_split JSONB NOT NULL,
    exercises JSONB NOT NULL,
    progression_guidance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_workout_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own workout plans" ON public.ai_workout_plans;
CREATE POLICY "Users can manage own workout plans" ON public.ai_workout_plans
    FOR ALL USING (auth.uid() = user_id);

-- Create ai_meal_plans table
CREATE TABLE IF NOT EXISTS public.ai_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    meal_plan JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_meal_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own meal plans" ON public.ai_meal_plans;
CREATE POLICY "Users can manage own meal plans" ON public.ai_meal_plans
    FOR ALL USING (auth.uid() = user_id);

-- Alter daily_summaries to support checkins
ALTER TABLE public.daily_summaries
ADD COLUMN IF NOT EXISTS energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5);

-- Create weekly_reviews table
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weight_change NUMERIC(5,2),
    workout_consistency NUMERIC(5,2),
    protein_consistency NUMERIC(5,2),
    calorie_adherence NUMERIC(5,2),
    habit_completion NUMERIC(5,2),
    avg_sleep NUMERIC(4,2),
    avg_water INTEGER,
    avg_steps INTEGER,
    ai_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can manage own weekly reviews" ON public.weekly_reviews
    FOR ALL USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('protein', 'water', 'workout', 'weight')),
    enabled BOOLEAN DEFAULT TRUE,
    time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
CREATE POLICY "Users can manage own reminders" ON public.reminders
    FOR ALL USING (auth.uid() = user_id);
