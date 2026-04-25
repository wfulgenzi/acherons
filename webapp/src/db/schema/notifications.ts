import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organisations } from "./organisations";

// ---------------------------------------------------------------------------
// notifications (one row per event for the recipient org’s inbox)
// ---------------------------------------------------------------------------
// - `orgId`: the org that should see this in the bell / list (inbox owner).
// - `type` / `context`: see `@/lib/notifications/contract` (validation + path helpers).
// - `readAt`: when any member of that org marks seen, it is seen for the org.
// - Inserts: use `@/lib/notifications/emit.server` only (admin connection,
//   validated `type` / `context` via contract). Do not grant INSERT to `app_user`.
// - Select / update (mark read): `app_user` + withRLS + RLS on `org_id`.
// ---------------------------------------------------------------------------

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  context: jsonb("context")
    .notNull()
    .default(sql`'{}'::jsonb`),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
