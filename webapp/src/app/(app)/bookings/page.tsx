import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { bookings, requests, memberships, organisations } from "@/db/schema";
import {
  DispatcherBookingsView,
  type BookingRow,
} from "./_dispatcher/DispatcherBookingsView";
import { ClinicBookingsView } from "./_clinic/ClinicBookingsView";
import type { ClinicBookingItem } from "./_clinic/types";

export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberRows = await db
    .select({ orgId: memberships.orgId, orgType: organisations.type })
    .from(memberships)
    .innerJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  const membership = memberRows[0];
  if (!membership) redirect("/onboarding");

  // ── Clinic view ────────────────────────────────────────────────────────────
  if (membership.orgType === "clinic") {
    const rows = await db
      .select({
        id: bookings.id,
        confirmedStart: bookings.confirmedStart,
        confirmedEnd: bookings.confirmedEnd,
        requestId: requests.id,
        patientAge: requests.patientAge,
        patientGender: requests.patientGender,
        caseDescription: requests.caseDescription,
      })
      .from(bookings)
      .innerJoin(requests, eq(requests.id, bookings.requestId))
      .where(eq(bookings.clinicOrgId, membership.orgId))
      .orderBy(bookings.confirmedStart);

    const items: ClinicBookingItem[] = rows.map((r) => ({
      id: r.id,
      requestId: r.requestId,
      confirmedStart: r.confirmedStart.toISOString(),
      confirmedEnd: r.confirmedEnd.toISOString(),
      patientAge: r.patientAge,
      patientGender: r.patientGender,
      caseDescription: r.caseDescription,
    }));

    return (
      <ClinicBookingsView items={items} today={new Date().toISOString()} />
    );
  }

  // ── Dispatcher view ────────────────────────────────────────────────────────
  const clinicOrg = organisations;

  const rows = await db
    .select({
      id: bookings.id,
      confirmedStart: bookings.confirmedStart,
      confirmedEnd: bookings.confirmedEnd,
      requestId: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      clinicName: clinicOrg.name,
    })
    .from(bookings)
    .innerJoin(requests, eq(requests.id, bookings.requestId))
    .innerJoin(clinicOrg, eq(clinicOrg.id, bookings.clinicOrgId))
    .where(eq(bookings.dispatcherOrgId, membership.orgId))
    .orderBy(bookings.confirmedStart);

  const data: BookingRow[] = rows.map((r) => ({
    id: r.id,
    requestId: r.requestId,
    confirmedStart: r.confirmedStart.toISOString(),
    confirmedEnd: r.confirmedEnd.toISOString(),
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    clinicName: r.clinicName,
  }));

  return (
    <DispatcherBookingsView data={data} today={new Date().toISOString()} />
  );
}
