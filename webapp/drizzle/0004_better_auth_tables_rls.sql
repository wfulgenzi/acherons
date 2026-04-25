-- Better Auth tables (Drizzle + direct DB access only). The Data API (PostgREST) was
-- able to read them without RLS. With RLS enabled and no policies, `anon` and
-- `authenticated` get no rows. Table owner / superuser connections used by the app
-- bypass RLS and keep working.
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;
