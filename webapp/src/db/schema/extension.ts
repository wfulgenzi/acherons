import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const extensionRefreshStatusEnum = pgEnum("extension_refresh_status", [
  "active",
  "consumed",
]);

// ---------------------------------------------------------------------------
// extension_client — one “family” / linked install line (returned as client_id)
// ---------------------------------------------------------------------------

export const extensionClient = pgTable(
  "extension_client",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("extension_client_user_id_idx").on(t.userId)],
);

// ---------------------------------------------------------------------------
// extension_handoff_code — one-time browser → extension bootstrap (hashed)
// ---------------------------------------------------------------------------

export const extensionHandoffCode = pgTable("extension_handoff_code", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeHash: text("code_hash").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// extension_refresh — active + consumed tombstones; max consumed enforced in app
// (constant EXTENSION_REFRESH_TOMBSTONE_CAP) and optional global cron
// ---------------------------------------------------------------------------

export const extensionRefresh = pgTable(
  "extension_refresh",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => extensionClient.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    status: extensionRefreshStatusEnum("status").notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // At most one `active` refresh per client (enforced in DB).
    uniqueIndex("extension_refresh_client_id_active_unique")
      .on(t.clientId)
      .where(sql`${t.status} = 'active'`),
  ],
);
