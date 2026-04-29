-- Supabase client / PostgREST / Realtime use the JWT's `role` ("authenticated"), not
-- the custom `app_user` used by withRLS / Drizzle. Without these grants, RLS is never
-- evaluated for that role. Skipped when `authenticated` does not exist (vanilla Postgres).
DO
$$
  BEGIN
    IF EXISTS (
      SELECT
        1
      FROM
        pg_roles
      WHERE
        rolname = 'authenticated'
    ) THEN
      GRANT SELECT, UPDATE ON public.notifications TO authenticated;
    END IF;
  END
$$;
