-- Supabase client / PostgREST / Realtime use the JWT’s `role` (here:
-- "authenticated"), not the custom `app_user` used by withRLS / Drizzle.
-- Without these grants, RLS can never be evaluated: permission denied.
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
