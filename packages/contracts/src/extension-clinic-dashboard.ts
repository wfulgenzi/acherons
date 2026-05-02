/**
 * GET `/api/extension/clinic/dashboard` — clinic workspace summary for the Chrome extension.
 */
import * as v from "valibot";

export const PatientGenderSchema = v.picklist([
  "male",
  "female",
  "other",
  "unknown",
]);

export const ExtensionClinicDashboardStatCardsSchema = v.object({
  newRequestsCount: v.number(),
  todayCount: v.number(),
  weekCount: v.number(),
  completedCount: v.number(),
});

export const ExtensionClinicDashboardNewRequestItemSchema = v.object({
  id: v.string(),
  patientAge: v.nullable(v.number()),
  patientGender: v.nullable(PatientGenderSchema),
  caseDescription: v.string(),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  proposalStatus: v.nullable(
    v.picklist(["pending", "accepted", "rejected"]),
  ),
});

export const ExtensionClinicDashboardBookingSliceSchema = v.object({
  id: v.string(),
  confirmedStart: v.pipe(v.string(), v.isoTimestamp()),
  confirmedEnd: v.pipe(v.string(), v.isoTimestamp()),
  patientAge: v.nullable(v.number()),
  patientGender: v.nullable(PatientGenderSchema),
  caseDescription: v.string(),
});

export const ExtensionClinicDashboardTodayItemSchema = v.object({
  id: v.string(),
  confirmedStart: v.pipe(v.string(), v.isoTimestamp()),
  confirmedEnd: v.pipe(v.string(), v.isoTimestamp()),
  patientAge: v.nullable(v.number()),
  caseDescription: v.string(),
});

export const ExtensionClinicDashboardActivityItemSchema = v.object({
  id: v.string(),
  status: v.picklist(["pending", "accepted", "rejected"]),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  patientAge: v.nullable(v.number()),
  patientGender: v.nullable(PatientGenderSchema),
});

/**
 * Same org-scoped rows as the webapp bell inbox (`notifications`), filtered server-side (e.g. last 24h).
 */
export const ExtensionClinicDashboardInboxItemSchema = v.object({
  id: v.string(),
  type: v.string(),
  readAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  /** Short line — mirrors `labelForNotificationType` in the webapp. */
  label: v.string(),
});

export const ExtensionClinicDashboardResponseSchema = v.object({
  statCards: ExtensionClinicDashboardStatCardsSchema,
  /** In-app notifications for this org, recent window (see API handler). */
  newItems: v.array(ExtensionClinicDashboardInboxItemSchema),
  newRequestsItems: v.array(ExtensionClinicDashboardNewRequestItemSchema),
  upcomingBookingsItems: v.array(ExtensionClinicDashboardBookingSliceSchema),
  todayScheduleItems: v.array(ExtensionClinicDashboardTodayItemSchema),
  recentActivityItems: v.array(ExtensionClinicDashboardActivityItemSchema),
});

export type ExtensionClinicDashboardResponse = v.InferOutput<
  typeof ExtensionClinicDashboardResponseSchema
>;
