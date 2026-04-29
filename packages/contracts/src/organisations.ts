import * as v from "valibot";
import {
  type OpeningHours,
  openingHoursSchema,
} from "./opening-hours";

export type { OpeningHours } from "./opening-hours";

/** POST/PATCH admin `/api/organisations` body — mirrors persisted clinic profile columns where relevant. */
export const CreateOrganisationSchema = v.object({
  name: v.pipe(
    v.string("name must be a string"),
    v.minLength(1, "name is required"),
  ),
  type: v.picklist(["dispatch", "clinic"]),
  address: v.optional(v.union([v.string(), v.null()])),
  latitude: v.optional(v.union([v.number(), v.null()])),
  longitude: v.optional(v.union([v.number(), v.null()])),
  phone: v.optional(v.union([v.string(), v.null()])),
  website: v.optional(v.union([v.string(), v.null()])),
  mapsUrl: v.optional(v.union([v.string(), v.null()])),
  specialisations: v.optional(v.union([v.array(v.string()), v.null()])),
  openingHours: v.optional(v.union([openingHoursSchema, v.null()])),
});

export type CreateOrganisationInput = v.InferOutput<
  typeof CreateOrganisationSchema
>;

/** PATCH `/api/organisations/:id` — partial updates only. */
export const UpdateOrganisationSchema = v.partial(CreateOrganisationSchema);

export type UpdateOrganisationInput = v.InferOutput<
  typeof UpdateOrganisationSchema
>;

/** JSON wire shape for organisation rows (`Date` becomes ISO strings over HTTP). */
export type ApiClinicProfile = {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  specialisations: string[] | null;
  openingHours: OpeningHours | null;
};

export type ApiOrganisation = {
  id: string;
  name: string;
  type: "dispatch" | "clinic";
  createdAt: string;
  updatedAt: string;
  clinicProfile: ApiClinicProfile | null;
};
