-- Inbox is org-scoped: `notifications.org_id` is the only row-level scoping.
-- - Drizzle + withRLS: set `app.org_id`.
-- - Supabase client / Realtime: mint a JWT with an `org_id` claim (same as the
--   user’s single org). No separate membership subquery: org in session/token
--   must match the row.
-- Inserts: no policy for `app_user` (deny). Insert via a role that bypasses RLS
-- after validating in app code.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Effective org: transaction GUC first, else JWT `org_id` (Realtime).
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (
    notifications.org_id = COALESCE(
      NULLIF(current_setting('app.org_id', true), '')::uuid,
      NULLIF((auth.jwt() ->> 'org_id'), '')::uuid
    )
  );

CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (
    notifications.org_id = COALESCE(
      NULLIF(current_setting('app.org_id', true), '')::uuid,
      NULLIF((auth.jwt() ->> 'org_id'), '')::uuid
    )
  )
  WITH CHECK (
    notifications.org_id = COALESCE(
      NULLIF(current_setting('app.org_id', true), '')::uuid,
      NULLIF((auth.jwt() ->> 'org_id'), '')::uuid
    )
  );

GRANT SELECT, UPDATE ON notifications TO app_user;
