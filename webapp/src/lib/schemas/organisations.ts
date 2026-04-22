import * as v from "valibot";
import { createInsertSchema } from "drizzle-valibot";
import { organisations, clinicProfiles } from "@/db/schema";

// ---------------------------------------------------------------------------
// drizzle-valibot generates base schemas from your table definitions.
// Field types, nullability, and enum values are derived from Drizzle — no
// manual duplication. We then omit auto-generated fields and compose the
// per-table pieces into the API input schemas below.
// ---------------------------------------------------------------------------

const OrgBase = createInsertSchema(organisations);
const ClinicBase = createInsertSchema(clinicProfiles);

// Individual clinic profile fields, all optional for API use
const ClinicFields = v.partial(
  v.omit(ClinicBase, ["orgId", "createdAt", "updatedAt"])
);

// ---------------------------------------------------------------------------
// POST /api/organisations
// name + type are required; clinic fields are optional and only used when
// type = "clinic" (enforced in the route handler).
// ---------------------------------------------------------------------------

export const CreateOrganisationSchema = v.object({
  name: v.pipe(
    v.string("name must be a string"),
    v.minLength(1, "name is required")
  ),
  type: v.omit(OrgBase, ["id", "name", "createdAt", "updatedAt"]).entries.type,
  ...ClinicFields.entries,
});

export type CreateOrganisationInput = v.InferOutput<typeof CreateOrganisationSchema>;

// ---------------------------------------------------------------------------
// PATCH /api/organisations/:id
// Everything is optional — only provided fields are updated.
// ---------------------------------------------------------------------------

export const UpdateOrganisationSchema = v.partial(CreateOrganisationSchema);

export type UpdateOrganisationInput = v.InferOutput<typeof UpdateOrganisationSchema>;
