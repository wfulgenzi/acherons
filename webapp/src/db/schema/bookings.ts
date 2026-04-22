import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { organisations } from "./organisations";
import { requests } from "./requests";
import { proposals } from "./proposals";

// ---------------------------------------------------------------------------
// bookings — created when a dispatcher accepts a proposal
//
// Unique constraints on request_id and proposal_id enforce the invariant that
// each request and each proposal can only ever result in one booking.
//
// Both org FKs are denormalized copies of the data already held in the linked
// request/proposal rows. This means tenant-scoped queries on bookings never
// need a join — just a WHERE dispatcher_org_id = $x or clinic_org_id = $x.
// ---------------------------------------------------------------------------

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),

  requestId: uuid("request_id")
    .notNull()
    .unique()
    .references(() => requests.id, { onDelete: "restrict" }),

  proposalId: uuid("proposal_id")
    .notNull()
    .unique()
    .references(() => proposals.id, { onDelete: "restrict" }),

  // Tenant isolation — denormalized from request + proposal for direct filtering
  dispatcherOrgId: uuid("dispatcher_org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "restrict" }),

  clinicOrgId: uuid("clinic_org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "restrict" }),

  // The specific slot the dispatcher chose from proposals.proposed_timeslots
  confirmedStart: timestamp("confirmed_start").notNull(),
  confirmedEnd: timestamp("confirmed_end").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});
