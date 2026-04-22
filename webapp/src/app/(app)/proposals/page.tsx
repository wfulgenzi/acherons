import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { proposals, requests, memberships, organisations } from "@/db/schema";
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
        id: proposals.id,
        status: proposals.status,
        proposedTimeslots: proposals.proposedTimeslots,
        createdAt: proposals.createdAt,
        requestId: requests.id,
        patientAge: requests.patientAge,
        patientGender: requests.patientGender,
        caseDescription: requests.caseDescription,
      })
      .from(proposals)
      .innerJoin(requests, eq(requests.id, proposals.requestId))
      .where(eq(proposals.clinicOrgId, membership.orgId))
      .orderBy(desc(proposals.createdAt));

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

  // ── Dispatcher view ────────────────────────────────────────────────────────
  const clinicOrg = organisations;

  const rows = await db
    .select({
      id: proposals.id,
      status: proposals.status,
      proposedTimeslots: proposals.proposedTimeslots,
      createdAt: proposals.createdAt,
      requestId: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      clinicName: clinicOrg.name,
    })
    .from(proposals)
    .innerJoin(requests, eq(requests.id, proposals.requestId))
    .innerJoin(clinicOrg, eq(clinicOrg.id, proposals.clinicOrgId))
    .where(eq(proposals.dispatcherOrgId, membership.orgId))
    .orderBy(desc(proposals.createdAt));

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
