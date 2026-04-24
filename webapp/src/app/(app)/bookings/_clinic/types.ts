export type ClinicBookingItem = {
  id: string;
  requestId: string;
  confirmedStart: string; // ISO
  confirmedEnd: string; // ISO
  patientAge: number | null;
  patientGender: "male" | "female" | "other" | "unknown" | null;
  caseDescription: string;
};
