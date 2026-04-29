import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
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

// ---------------------------------------------------------------------------
// web_push_subscription — browser PushManager subscriptions (VAPID, etc.)
// ---------------------------------------------------------------------------
// - `endpoint` is unique (one row per device subscription URL).
// - `keys` holds PushSubscription JSON keys: `{ p256dh, auth }` (base64url).
// - `client_id` → `extension_client` when the subscriber is a linked extension
//   install; dropped with `user` or that client (e.g. line revoked) via CASCADE.
// ---------------------------------------------------------------------------

export const webPushSubscription = pgTable(
  "web_push_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => extensionClient.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull().unique(),
    keys: jsonb("keys")
      .notNull()
      .$type<{ p256dh: string; auth: string }>(),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    failureCount: integer("failure_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("web_push_subscription_user_id_idx").on(t.userId),
    index("web_push_subscription_client_id_idx").on(t.clientId),
  ],
);
