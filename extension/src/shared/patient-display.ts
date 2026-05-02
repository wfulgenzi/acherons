/** Nullable patient gender from extension API payloads. */
export type NullablePatientGender =
  | "male"
  | "female"
  | "other"
  | "unknown"
  | null;

export function genderShort(g: NullablePatientGender): string {
  if (g === "male") {
    return "M";
  }
  if (g === "female") {
    return "F";
  }
  if (g === "other") {
    return "Other";
  }
  return "—";
}

export type NullableProposalStatus = "pending" | "accepted" | "rejected" | null;

export function proposalStatusLabel(
  s: NullableProposalStatus,
): string | null {
  if (s === "pending") {
    return "Proposal pending";
  }
  if (s === "accepted") {
    return "Accepted";
  }
  if (s === "rejected") {
    return "Rejected";
  }
  return null;
}
