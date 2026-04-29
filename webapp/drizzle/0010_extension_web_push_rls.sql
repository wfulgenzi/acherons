-- User-scoped extension + Web Push: policies use `app.user_id` only (see `withRLS` with
-- `orgId` omitted). Exchange / refresh / handoff still use the admin connection.
ALTER TABLE "extension_client" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "web_push_subscription" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "extension_client_owner_select" ON "extension_client" FOR SELECT TO "app_user" USING (user_id = current_setting('app.user_id', true));--> statement-breakpoint
-- No INSERT/UPDATE/DELETE policies for app_user: only the bypass role creates/revokes clients.
CREATE POLICY "web_push_subscription_owner_select" ON "web_push_subscription" FOR SELECT TO "app_user" USING (user_id = current_setting('app.user_id', true));--> statement-breakpoint
CREATE POLICY "web_push_subscription_owner_insert" ON "web_push_subscription" FOR INSERT TO "app_user" WITH CHECK (user_id = current_setting('app.user_id', true) AND (EXISTS (SELECT 1 FROM "extension_client" AS ec WHERE ec.id = client_id AND ec.user_id = current_setting('app.user_id', true) AND ec.revoked_at IS NULL)));--> statement-breakpoint
CREATE POLICY "web_push_subscription_owner_update" ON "web_push_subscription" FOR UPDATE TO "app_user" USING (user_id = current_setting('app.user_id', true)) WITH CHECK (user_id = current_setting('app.user_id', true) AND (EXISTS (SELECT 1 FROM "extension_client" AS ec WHERE ec.id = client_id AND ec.user_id = current_setting('app.user_id', true) AND ec.revoked_at IS NULL)));--> statement-breakpoint
CREATE POLICY "web_push_subscription_owner_delete" ON "web_push_subscription" FOR DELETE TO "app_user" USING (user_id = current_setting('app.user_id', true));--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "web_push_subscription" TO "app_user";
