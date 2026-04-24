import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { withRLS, withUserContext } from "@/db/rls";
import { membershipsRepo, proposalsRepo } from "@/db/repositories";
import {
  ClinicProposalsView,
  type ProposalRow,
} from "./_clinic/ClinicProposalsView";
import {
  DispatcherProposalsView,
  type DispatcherProposalRow,
} from "./_dispatcher/DispatcherProposalsView";
import type { ProposedTimeslots } from "@/db/schema";

export default async function ProposalsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const membership = await withUserContext(session.user.id, (tx) =>
    membershipsRepo.findByUserId(tx, session.user.id)
  );
  if (!membership) redirect("/onboarding");

  if (membership.orgType === "clinic") {
    const rows = await withRLS(
      { userId: session.user.id, orgId: membership.orgId },
      (tx) => proposalsRepo.findByClinic(tx, membership.orgId)
    );

    const data: ProposalRow[] = rows.map((r) => {
      const slots = r.proposedTimeslots as ProposedTimeslots | null;
      const first = slots?.[0] ?? null;
      return {
        id: r.id,
        requestShortId: r.requestId.slice(0, 4).toUpperCase(),
        patientAge: r.patientAge,
        patientGender: r.patientGender,
        caseDescription: r.caseDescription,
        proposedStart: first?.start ?? null,
        proposedEnd: first?.end ?? null,
        status: r.status,
        submittedAt: r.createdAt.toISOString(),
      };
    });

    return <ClinicProposalsView data={data} />;
  }

  const rows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => proposalsRepo.findByDispatcher(tx, membership.orgId)
  );

  const data: DispatcherProposalRow[] = rows.map((r) => {
    const slots = r.proposedTimeslots as ProposedTimeslots | null;
    const first = slots?.[0] ?? null;
    return {
      id: r.id,
      requestId: r.requestId,
      requestShortId: r.requestId.slice(0, 4).toUpperCase(),
      patientAge: r.patientAge,
      patientGender: r.patientGender,
      caseDescription: r.caseDescription,
      clinicName: r.clinicName,
      proposedStart: first?.start ?? null,
      proposedEnd: first?.end ?? null,
      status: r.status,
      submittedAt: r.createdAt.toISOString(),
    };
  });

  return <DispatcherProposalsView data={data} />;
}
