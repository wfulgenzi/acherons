import { pgTable, pgEnum, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organisations } from "./organisations";

export const membershipRoleEnum = pgEnum("membership_role", [
  "member",
  "admin",
]);

// One row per user. UNIQUE on user_id enforces the single-org-per-user rule
// at the database level. The role here is org-level (distinct from global isAdmin).
export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "cascade" }),
  role: membershipRoleEnum("role").notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
