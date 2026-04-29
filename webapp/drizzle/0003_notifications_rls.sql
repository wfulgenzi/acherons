-- Org scope for notifications RLS lives in `notification_session_org_id()` so core
-- migrations run on any Postgres (Docker / CI). The default implementation uses only
-- `current_setting('app.org_id', true)` (Drizzle `withRLS`).
--
-- On Supabase, run `drizzle/supabase/notification_org_id_with_jwt.sql` after migrate to
-- replace this function with one that also reads `auth.jwt() ->> 'org_id'` for Realtime.
CREATE OR REPLACE FUNCTION public.notification_session_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.org_id', true), '')::uuid;
$$;

-- Inserts: no policy for `app_user` (deny). Insert via a role that bypasses RLS after
-- validating in app code.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (notifications.org_id = public.notification_session_org_id());

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (notifications.org_id = public.notification_session_org_id())
  WITH CHECK (notifications.org_id = public.notification_session_org_id());

GRANT SELECT, UPDATE ON notifications TO app_user;
