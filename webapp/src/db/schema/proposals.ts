import {
  pgTable,
  pgEnum,
  uuid,
  text,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organisations } from "./organisations";
import { requests } from "./requests";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const proposalStatusEnum = pgEnum("proposal_status", [
  "pending",
  "accepted",
  "rejected",
]);

// ---------------------------------------------------------------------------
// Timeslot type — each proposed slot has an explicit start and end
// ---------------------------------------------------------------------------

export type ProposedTimeslot = {
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
};

export type ProposedTimeslots = ProposedTimeslot[];

// ---------------------------------------------------------------------------
// proposals — created by clinic orgs in response to an open request
// ---------------------------------------------------------------------------

export const proposals = pgTable("proposals", {
  id: uuid("id").primaryKey().defaultRandom(),

  requestId: uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "restrict" }),

  // Tenant isolation — both sides have a direct FK
  clinicOrgId: uuid("clinic_org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "restrict" }),

  // Denormalized from requests.dispatcher_org_id — lets dispatchers filter
  // their proposals with a simple WHERE rather than a join
  dispatcherOrgId: uuid("dispatcher_org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "restrict" }),

  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),

  status: proposalStatusEnum("status").notNull().default("pending"),

  proposedTimeslots: jsonb("proposed_timeslots")
    .$type<ProposedTimeslots>()
    .notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
