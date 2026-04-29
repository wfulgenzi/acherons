-- Run via `yarn db:migrate:supabase` (migrate + all files here), or only overlays:
-- `yarn db:apply-supabase-overlays` — requires DATABASE_ADMIN_URL in `.env.local`.
--
-- Replaces `notification_session_org_id` after journal migrations created the portable
-- stub in `0003_notifications_rls.sql`, so Realtime / PostgREST can resolve org from JWT
-- when `app.org_id` is unset.
CREATE OR REPLACE FUNCTION public.notification_session_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.org_id', true), '')::uuid,
    NULLIF((auth.jwt() ->> 'org_id'), '')::uuid
  );
$$;
