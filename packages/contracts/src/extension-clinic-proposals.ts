/**
 * GET `/api/extension/clinic/proposals` — pending proposals submitted by the clinic (same RLS as webapp).
 */
import * as v from "valibot";
import { PatientGenderSchema } from "./extension-clinic-dashboard";

export const ExtensionClinicProposalItemSchema = v.object({
  id: v.string(),
  /** Full request id for `/requests/:id` in the webapp. */
  requestId: v.string(),
  requestShortId: v.string(),
  patientAge: v.nullable(v.number()),
  patientGender: v.nullable(PatientGenderSchema),
  caseDescription: v.string(),
  proposedStart: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  proposedEnd: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  status: v.literal("pending"),
  submittedAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const ExtensionClinicProposalsResponseSchema = v.object({
  items: v.array(ExtensionClinicProposalItemSchema),
});

export type ExtensionClinicProposalItem = v.InferOutput<
  typeof ExtensionClinicProposalItemSchema
>;

export type ExtensionClinicProposalsResponse = v.InferOutput<
  typeof ExtensionClinicProposalsResponseSchema
>;
