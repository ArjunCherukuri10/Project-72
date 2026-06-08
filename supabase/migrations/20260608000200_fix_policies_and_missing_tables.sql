-- Fix: Add INSERT policy for profiles (needed when user signs up)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create missing tables referenced in code

-- Workout templates
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage workout templates" ON public.workout_templates;
CREATE POLICY "Users can manage workout templates" ON public.workout_templates
    FOR ALL USING (auth.uid() = user_id);

-- Template exercises
CREATE TABLE IF NOT EXISTS public.template_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    target_sets INTEGER NOT NULL,
    target_reps INTEGER NOT NULL,
    rest_time_seconds INTEGER,
    sort_order INTEGER NOT NULL,
    notes TEXT
);

ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage template exercises" ON public.template_exercises;
CREATE POLICY "Users can manage template exercises" ON public.template_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_templates wt
            WHERE wt.id = template_id AND wt.user_id = auth.uid()
        )
    );

-- Workout exercises (session-specific)
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    notes TEXT
);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can manage workout exercises" ON public.workout_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions ws
            WHERE ws.id = session_id AND ws.user_id = auth.uid()
        )
    );

-- Exercise sets
CREATE TABLE IF NOT EXISTS public.exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight NUMERIC(6,2) NOT NULL,
    is_warmup BOOLEAN DEFAULT FALSE,
    is_pr BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage exercise sets" ON public.exercise_sets;
CREATE POLICY "Users can manage exercise sets" ON public.exercise_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_exercises we
            JOIN public.workout_sessions ws ON ws.id = we.session_id
            WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
        )
    );

-- Cardio sessions
CREATE TABLE IF NOT EXISTS public.cardio_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    distance_km NUMERIC(6,2),
    calories_burned INTEGER,
    avg_pace TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cardio_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage cardio sessions" ON public.cardio_sessions;
CREATE POLICY "Users can manage cardio sessions" ON public.cardio_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Habit definitions
CREATE TABLE IF NOT EXISTS public.habit_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    target_frequency TEXT DEFAULT 'daily',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habit_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage habit definitions" ON public.habit_definitions;
CREATE POLICY "Users can manage habit definitions" ON public.habit_definitions
    FOR ALL USING (auth.uid() = user_id);

-- Habit logs
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habit_definitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage habit logs" ON public.habit_logs;
CREATE POLICY "Users can manage habit logs" ON public.habit_logs
    FOR ALL USING (auth.uid() = user_id);

-- Health metrics
CREATE TABLE IF NOT EXISTS public.health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metric_type TEXT NOT NULL,
    value NUMERIC(8,2) NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage health metrics" ON public.health_metrics;
CREATE POLICY "Users can manage health metrics" ON public.health_metrics
    FOR ALL USING (auth.uid() = user_id);

-- Milestones
CREATE TABLE IF NOT EXISTS public.milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    unlocked_at TIMESTAMPTZ,
    icon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage milestones" ON public.milestones;
CREATE POLICY "Users can manage milestones" ON public.milestones
    FOR ALL USING (auth.uid() = user_id);

-- Update goals table: add columns that code expects  
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'weight',
ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Goal',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS target_value NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS current_value NUMERIC(8,2),
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
