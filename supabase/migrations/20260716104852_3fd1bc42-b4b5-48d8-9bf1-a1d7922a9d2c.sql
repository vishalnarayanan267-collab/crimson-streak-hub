-- Admin role check function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _uid AND role = 'admin'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;

-- Allow admins to view and assign workouts for any client
CREATE POLICY "Admins view all workouts"
  ON public.assigned_workouts FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins insert workouts for any client"
  ON public.assigned_workouts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins update any workout"
  ON public.assigned_workouts FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins delete any workout"
  ON public.assigned_workouts FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Enable realtime for assigned_workouts so trainer sees tick-offs live
ALTER TABLE public.assigned_workouts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assigned_workouts;