import { pgTable, uuid, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { organisations } from "./organisations";
import { requests } from "./requests";

// ---------------------------------------------------------------------------
// request_clinic_access
// Controls which clinic orgs can see and respond to a given request.
// The dispatcher explicitly grants access when creating (or later editing) a request.
// ---------------------------------------------------------------------------

export const requestClinicAccess = pgTable(
  "request_clinic_access",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),

    clinicOrgId: uuid("clinic_org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),

    dispatcherOrgId: uuid("dispatcher_org_id")
      .notNull()
      .references(() => organisations.id, { onDelete: "cascade" }),

    grantedAt: timestamp("granted_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.clinicOrgId] })]
);
