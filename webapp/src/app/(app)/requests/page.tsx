import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { requestsRepo } from "@/db/repositories";
import {
  DispatcherRequestsView,
  type RequestRow,
} from "./_dispatcher/DispatcherRequestsView";
import {
  ClinicRequestsView,
  type ClinicRequestItem,
} from "./_clinic/ClinicRequestsView";

export default async function RequestsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getMembership(session.user.id);
  if (!membership) redirect("/onboarding");

  if (membership.orgType === "clinic") {
    const rows = await withRLS(
      { userId: session.user.id, orgId: membership.orgId },
      (tx) => requestsRepo.findAccessibleByClinic(tx, membership.orgId)
    );

    const items: ClinicRequestItem[] = rows.map((r) => ({
      id: r.id,
      patientAge: r.patientAge,
      patientGender: r.patientGender,
      caseDescription: r.caseDescription,
      postcode: r.postcode,
      createdAt: r.createdAt.toISOString(),
      creatorName: r.creatorName,
      creatorEmail: r.creatorEmail,
      proposalStatus: r.proposalStatus ?? null,
    }));

    return <ClinicRequestsView items={items} />;
  }

  const rows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => requestsRepo.findOpenByDispatcher(tx, membership.orgId)
  );

  const data: RequestRow[] = rows.map((r) => ({
    id: r.id,
    shortId: r.id.slice(0, 4).toUpperCase(),
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    postcode: r.postcode,
    creatorLabel: r.creatorName || r.creatorEmail || "",
    createdAt: r.createdAt.toISOString(),
    clinicsContacted: r.clinicsContacted,
    proposalCount: r.proposalCount,
  }));

  return <DispatcherRequestsView data={data} />;
}
