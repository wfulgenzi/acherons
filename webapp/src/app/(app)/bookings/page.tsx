import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { bookingsRepo } from "@/db/repositories";
import {
  DispatcherBookingsView,
  type BookingRow,
} from "./_dispatcher/DispatcherBookingsView";
import { ClinicBookingsView } from "./_clinic/ClinicBookingsView";
import type { ClinicBookingItem } from "./_clinic/types";

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    redirect("/onboarding");
  }

  if (membership.orgType === "clinic") {
    const rows = await withRLS(
      { userId: session.user.id, orgId: membership.orgId },
      (tx) => bookingsRepo.findByClinic(tx, membership.orgId),
    );

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

  const rows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => bookingsRepo.findByDispatcher(tx, membership.orgId),
  );

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
