/**
 * GET `/api/extension/clinic/bookings` — clinic bookings list (same rows as webapp bookings page).
 */
import * as v from "valibot";
import { PatientGenderSchema } from "./extension-clinic-dashboard";

export const ExtensionClinicBookingItemSchema = v.object({
  id: v.string(),
  requestId: v.string(),
  confirmedStart: v.pipe(v.string(), v.isoTimestamp()),
  confirmedEnd: v.pipe(v.string(), v.isoTimestamp()),
  patientAge: v.nullable(v.number()),
  patientGender: v.nullable(PatientGenderSchema),
  caseDescription: v.string(),
});

export const ExtensionClinicBookingsResponseSchema = v.object({
  items: v.array(ExtensionClinicBookingItemSchema),
  /** Server “today” for splitting upcoming vs past (matches webapp `loadBookingsPageData`). */
  todayIso: v.pipe(v.string(), v.isoTimestamp()),
});

export type ExtensionClinicBookingItem = v.InferOutput<
  typeof ExtensionClinicBookingItemSchema
>;

export type ExtensionClinicBookingsResponse = v.InferOutput<
  typeof ExtensionClinicBookingsResponseSchema
>;
