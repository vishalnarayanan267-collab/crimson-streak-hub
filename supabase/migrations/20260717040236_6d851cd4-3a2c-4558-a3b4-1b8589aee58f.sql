
-- 1) Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS height_cm numeric,
  ADD COLUMN IF NOT EXISTS primary_goal text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_primary_goal_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_primary_goal_check
  CHECK (primary_goal IS NULL OR primary_goal IN ('weight_loss','muscle_gain','general_conditioning'));

-- 2) Exercise logs (sets / reps / weight history)
CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id uuid REFERENCES public.assigned_workouts(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  sets integer NOT NULL DEFAULT 0,
  reps integer NOT NULL DEFAULT 0,
  weight_kg numeric NOT NULL DEFAULT 0,
  logged_date date NOT NULL DEFAULT (now())::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exercise_logs_client_date_idx
  ON public.exercise_logs (client_id, logged_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;

ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own logs" ON public.exercise_logs;
CREATE POLICY "Users view own logs" ON public.exercise_logs
  FOR SELECT TO authenticated USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users insert own logs" ON public.exercise_logs;
CREATE POLICY "Users insert own logs" ON public.exercise_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users update own logs" ON public.exercise_logs;
CREATE POLICY "Users update own logs" ON public.exercise_logs
  FOR UPDATE TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users delete own logs" ON public.exercise_logs;
CREATE POLICY "Users delete own logs" ON public.exercise_logs
  FOR DELETE TO authenticated USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Admins view all logs" ON public.exercise_logs;
CREATE POLICY "Admins view all logs" ON public.exercise_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins insert any logs" ON public.exercise_logs;
CREATE POLICY "Admins insert any logs" ON public.exercise_logs
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins update any logs" ON public.exercise_logs;
CREATE POLICY "Admins update any logs" ON public.exercise_logs
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins delete any logs" ON public.exercise_logs;
CREATE POLICY "Admins delete any logs" ON public.exercise_logs
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.exercise_logs;
