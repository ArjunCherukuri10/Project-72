-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    height_cm NUMERIC(5,2),
    goal_weight NUMERIC(5,2) DEFAULT 72.00,
    starting_weight NUMERIC(5,2) DEFAULT 94.00,
    date_of_birth DATE,
    gender TEXT,
    activity_level TEXT,
    units TEXT DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Create weight logs table
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weight NUMERIC(5,2) NOT NULL,
    date DATE NOT NULL,
    time_recorded TIME,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage weight logs" ON public.weight_logs;
CREATE POLICY "Users can manage weight logs" 
    ON public.weight_logs FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs(user_id, date DESC);

-- Create body measurements table
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    waist NUMERIC(5,2),
    neck NUMERIC(5,2),
    chest NUMERIC(5,2),
    shoulders NUMERIC(5,2),
    biceps NUMERIC(5,2),
    forearms NUMERIC(5,2),
    hips NUMERIC(5,2),
    thighs NUMERIC(5,2),
    calves NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage body measurements" ON public.body_measurements;
CREATE POLICY "Users can manage body measurements" 
    ON public.body_measurements FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_measurements_user_date ON public.body_measurements(user_id, date DESC);

-- Create food items table
CREATE TABLE IF NOT EXISTS public.food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    serving_size TEXT NOT NULL,
    calories INTEGER NOT NULL CHECK (calories >= 0),
    protein NUMERIC(5,2) DEFAULT 0.00,
    carbs NUMERIC(5,2) DEFAULT 0.00,
    fat NUMERIC(5,2) DEFAULT 0.00,
    fiber NUMERIC(5,2) DEFAULT 0.00,
    sugar NUMERIC(5,2) DEFAULT 0.00,
    sodium NUMERIC(7,2) DEFAULT 0.00,
    category TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage food items" ON public.food_items;
CREATE POLICY "Users can manage food items" 
    ON public.food_items FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_food_items_user_name ON public.food_items(user_id, name);

-- Create nutrition logs table
CREATE TABLE IF NOT EXISTS public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage nutrition logs" ON public.nutrition_logs;
CREATE POLICY "Users can manage nutrition logs" 
    ON public.nutrition_logs FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON public.nutrition_logs(user_id, date);

-- Create nutrition log items
CREATE TABLE IF NOT EXISTS public.nutrition_log_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nutrition_log_id UUID NOT NULL REFERENCES public.nutrition_logs(id) ON DELETE CASCADE,
    food_item_id UUID NOT NULL REFERENCES public.food_items(id) ON DELETE RESTRICT,
    servings NUMERIC(5,2) NOT NULL CHECK (servings > 0),
    calories INTEGER NOT NULL,
    protein NUMERIC(5,2) NOT NULL,
    carbs NUMERIC(5,2) NOT NULL,
    fat NUMERIC(5,2) NOT NULL,
    fiber NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.nutrition_log_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage nutrition log items" ON public.nutrition_log_items;
CREATE POLICY "Users can manage nutrition log items" 
    ON public.nutrition_log_items FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.nutrition_logs nl 
            WHERE nl.id = nutrition_log_id AND nl.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_log_items_log_id ON public.nutrition_log_items(nutrition_log_id);

-- Create workout sessions
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    date DATE NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    completed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage workout sessions" ON public.workout_sessions;
CREATE POLICY "Users can manage workout sessions" 
    ON public.workout_sessions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON public.workout_sessions(user_id, date);

-- Create daily summaries table for metrics aggregation
CREATE TABLE IF NOT EXISTS public.daily_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight NUMERIC(5,2),
    total_calories INTEGER DEFAULT 0,
    total_protein NUMERIC(5,2) DEFAULT 0,
    total_carbs NUMERIC(5,2) DEFAULT 0,
    total_fat NUMERIC(5,2) DEFAULT 0,
    total_fiber NUMERIC(5,2) DEFAULT 0,
    water_ml INTEGER DEFAULT 0,
    steps INTEGER DEFAULT 0,
    sleep_hours NUMERIC(4,2),
    workout_completed BOOLEAN DEFAULT FALSE,
    mood INTEGER CHECK (mood BETWEEN 1 AND 5),
    notes TEXT,
    compliance_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage daily summaries" ON public.daily_summaries;
CREATE POLICY "Users can manage daily summaries" 
    ON public.daily_summaries FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_summaries_user_date ON public.daily_summaries(user_id, date DESC);
