import "server-only";

import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import {
  listBookingsForClinic,
  listBookingsForDispatcher,
} from "@/server/bookings/bookings-rls-queries";
import type { ClinicBookingItem } from "@/app/(app)/bookings/_clinic/types";
import type { BookingRow } from "@/app/(app)/bookings/_dispatcher/DispatcherBookingsView";

type ClinicBookingRow = Awaited<
  ReturnType<typeof listBookingsForClinic>
>[number];

type DispatcherBookingRow = Awaited<
  ReturnType<typeof listBookingsForDispatcher>
>[number];

export type BookingsPageResult =
  | { kind: "redirect"; to: "/onboarding" }
  | {
      kind: "clinic";
      items: ClinicBookingItem[];
      todayIso: string;
    }
  | {
      kind: "dispatcher";
      data: BookingRow[];
      todayIso: string;
    };

export type BookingsPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
};

export function mapClinicRowsToItems(rows: ClinicBookingRow[]): ClinicBookingItem[] {
  return rows.map((r) => ({
    id: r.id,
    requestId: r.requestId,
    confirmedStart: r.confirmedStart.toISOString(),
    confirmedEnd: r.confirmedEnd.toISOString(),
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
  }));
}

export function mapDispatcherRowsToBookingRows(
  rows: DispatcherBookingRow[],
): BookingRow[] {
  return rows.map((r) => ({
    id: r.id,
    requestId: r.requestId,
    confirmedStart: r.confirmedStart.toISOString(),
    confirmedEnd: r.confirmedEnd.toISOString(),
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    clinicName: r.clinicName,
  }));
}

/**
 * Loads bookings for the authenticated user. Call from RSC after `getSession`
 * has verified the user; pass `session.user.id` so membership stays aligned
 * with `getMembership` cache() usage elsewhere.
 */
export async function loadBookingsPageData(
  userId: string,
  deps: BookingsPageLoaderDeps = {},
): Promise<BookingsPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership) {
    return { kind: "redirect", to: "/onboarding" };
  }

  const todayIso = new Date().toISOString();

  if (membership.orgType === "clinic") {
    const rows = await listBookingsForClinic(
      { userId, orgId: membership.orgId },
      membership.orgId,
    );
    return {
      kind: "clinic",
      items: mapClinicRowsToItems(rows),
      todayIso,
    };
  }

  const rows = await listBookingsForDispatcher(
    { userId, orgId: membership.orgId },
    membership.orgId,
  );
  return {
    kind: "dispatcher",
    data: mapDispatcherRowsToBookingRows(rows),
    todayIso,
  };
}
