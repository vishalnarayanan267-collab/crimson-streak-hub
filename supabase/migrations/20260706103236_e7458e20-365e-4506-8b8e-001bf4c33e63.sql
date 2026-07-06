
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  current_weight_kg numeric,
  calorie_target_kcal integer,
  protein_target_g integer,
  water_target_l numeric,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('admin','client')),
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Assigned workouts
CREATE TABLE public.assigned_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  assigned_date date NOT NULL DEFAULT (now()::date),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assigned_workouts TO authenticated;
GRANT ALL ON public.assigned_workouts TO service_role;
ALTER TABLE public.assigned_workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own workouts"
  ON public.assigned_workouts FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Users insert own workouts"
  ON public.assigned_workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users update own workouts"
  ON public.assigned_workouts FOR UPDATE TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users delete own workouts"
  ON public.assigned_workouts FOR DELETE TO authenticated USING (auth.uid() = client_id);

-- Leaderboard stats
CREATE TABLE public.leaderboard_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  has_freeze boolean NOT NULL DEFAULT true,
  last_logged_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.leaderboard_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leaderboard_stats TO authenticated;
GRANT ALL ON public.leaderboard_stats TO service_role;
ALTER TABLE public.leaderboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard viewable by everyone"
  ON public.leaderboard_stats FOR SELECT USING (true);
CREATE POLICY "Users insert own stats"
  ON public.leaderboard_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users update own stats"
  ON public.leaderboard_stats FOR UPDATE TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

-- Auto-create profile + leaderboard row + starter workouts on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  INSERT INTO public.leaderboard_stats (client_id) VALUES (NEW.id);

  INSERT INTO public.assigned_workouts (client_id, exercise_name) VALUES
    (NEW.id, 'Warm-up · 10 min'),
    (NEW.id, 'Compound lift'),
    (NEW.id, 'Accessory work'),
    (NEW.id, 'Conditioning'),
    (NEW.id, 'Mobility & stretch');

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER leaderboard_touch BEFORE UPDATE ON public.leaderboard_stats
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
