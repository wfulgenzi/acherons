import { pgTable, pgEnum, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organisations } from "./organisations";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const requestStatusEnum = pgEnum("request_status", [
  "open",
  "confirmed",
  "cancelled",
]);

export const patientGenderEnum = pgEnum("patient_gender", [
  "male",
  "female",
  "other",
  "unknown",
]);

// ---------------------------------------------------------------------------
// requests — created by dispatcher orgs, one per patient case
// ---------------------------------------------------------------------------

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Tenant isolation: direct FK so every query can filter without a join
  dispatcherOrgId: uuid("dispatcher_org_id")
    .notNull()
    .references(() => organisations.id, { onDelete: "restrict" }),

  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),

  status: requestStatusEnum("status").notNull().default("open"),

  // Patient info
  patientAge: integer("patient_age"),
  patientGender: patientGenderEnum("patient_gender"),
  caseDescription: text("case_description").notNull(),

  // Location — postcode is required; full address is optional
  postcode: text("postcode").notNull(),
  address: text("address"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
