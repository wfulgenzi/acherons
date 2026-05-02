/**
 * GET `/api/extension/clinic/requests` — clinic-visible requests (same rows as webapp requests page).
 */
import * as v from "valibot";
import { PatientGenderSchema } from "./extension-clinic-dashboard";

export const ExtensionClinicRequestItemSchema = v.object({
  id: v.string(),
  patientAge: v.nullable(v.number()),
  patientGender: v.nullable(PatientGenderSchema),
  caseDescription: v.string(),
  postcode: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  creatorName: v.nullable(v.string()),
  creatorEmail: v.nullable(v.string()),
  proposalStatus: v.nullable(
    v.picklist(["pending", "accepted", "rejected"]),
  ),
});

export const ExtensionClinicRequestsResponseSchema = v.object({
  items: v.array(ExtensionClinicRequestItemSchema),
});

export type ExtensionClinicRequestItem = v.InferOutput<
  typeof ExtensionClinicRequestItemSchema
>;

export type ExtensionClinicRequestsResponse = v.InferOutput<
  typeof ExtensionClinicRequestsResponseSchema
>;
