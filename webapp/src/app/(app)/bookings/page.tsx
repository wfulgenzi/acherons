import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { withRLS, withUserContext } from "@/db/rls";
import { membershipsRepo, bookingsRepo } from "@/db/repositories";
import {
  DispatcherBookingsView,
  type BookingRow,
} from "./_dispatcher/DispatcherBookingsView";
import { ClinicBookingsView } from "./_clinic/ClinicBookingsView";
import type { ClinicBookingItem } from "./_clinic/types";

export default async function BookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const membership = await withUserContext(session.user.id, (tx) =>
    membershipsRepo.findByUserId(tx, session.user.id)
  );
  if (!membership) redirect("/onboarding");

  if (membership.orgType === "clinic") {
    const rows = await withRLS(
      { userId: session.user.id, orgId: membership.orgId },
      (tx) => bookingsRepo.findByClinic(tx, membership.orgId)
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

    return <ClinicBookingsView items={items} today={new Date().toISOString()} />;
  }

  const rows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => bookingsRepo.findByDispatcher(tx, membership.orgId)
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

  return <DispatcherBookingsView data={data} today={new Date().toISOString()} />;
}
