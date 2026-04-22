import {
  pgTable,
  pgEnum,
  uuid,
  text,
  doublePrecision,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const organisationTypeEnum = pgEnum("organisation_type", [
  "dispatch",
  "clinic",
]);

// ---------------------------------------------------------------------------
// Opening hours type
// Each entry represents one day. Slots are [HH:MM, HH:MM] pairs.
// e.g. [{ day: 0, slots: [["09:00", "12:00"], ["14:00", "18:00"]] }, ...]
// ---------------------------------------------------------------------------

export type TimeSlot = [string, string];

export type OpeningHoursDay = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday … 6 = Sunday
  slots: TimeSlot[];
};

export type OpeningHours = OpeningHoursDay[];

// ---------------------------------------------------------------------------
// organisations — base tenant table, exists for both types
// ---------------------------------------------------------------------------

export const organisations = pgTable("organisations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: organisationTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// clinic_profiles — only exists when organisations.type = 'clinic'
// org_id is both the PK and the FK (strict 1-to-1, no surrogate key needed)
// ---------------------------------------------------------------------------

export const clinicProfiles = pgTable("clinic_profiles", {
  orgId: uuid("org_id")
    .primaryKey()
    .references(() => organisations.id, { onDelete: "cascade" }),
  address: text("address"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  phone: text("phone"),
  website: text("website"),
  mapsUrl: text("maps_url"),
  specialisations: text("specialisations").array(),
  openingHours: jsonb("opening_hours").$type<OpeningHours>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
