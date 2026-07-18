
-- 1) Backfill legacy nulls
UPDATE public.profiles SET age = 25 WHERE age IS NULL;
UPDATE public.profiles SET height_cm = 170 WHERE height_cm IS NULL;
UPDATE public.profiles SET primary_goal = 'general_conditioning' WHERE primary_goal IS NULL;

-- 2) Defaults for future inserts
ALTER TABLE public.profiles
  ALTER COLUMN age SET DEFAULT 25,
  ALTER COLUMN height_cm SET DEFAULT 170,
  ALTER COLUMN primary_goal SET DEFAULT 'general_conditioning';

-- 3) Admin audit logs
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.admin_audit_logs TO authenticated;
GRANT ALL ON public.admin_audit_logs TO service_role;

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Trainees can view their own audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

CREATE INDEX admin_audit_logs_created_at_idx ON public.admin_audit_logs (created_at DESC);
CREATE INDEX admin_audit_logs_client_id_idx ON public.admin_audit_logs (client_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_audit_logs;
