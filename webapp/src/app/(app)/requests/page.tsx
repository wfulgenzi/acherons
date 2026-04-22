import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  requests,
  requestClinicAccess,
  proposals,
  memberships,
  organisations,
  user,
} from "@/db/schema";
import {
  DispatcherRequestsView,
  type RequestRow,
} from "./_dispatcher/DispatcherRequestsView";
import {
  ClinicRequestsView,
  type ClinicRequestItem,
} from "./_clinic/ClinicRequestsView";

export default async function RequestsPage() {
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
        id: requests.id,
        patientAge: requests.patientAge,
        patientGender: requests.patientGender,
        caseDescription: requests.caseDescription,
        postcode: requests.postcode,
        createdAt: requests.createdAt,
        creatorName: user.name,
        creatorEmail: user.email,
        proposalStatus: proposals.status,
      })
      .from(requests)
      .innerJoin(
        requestClinicAccess,
        and(
          eq(requestClinicAccess.requestId, requests.id),
          eq(requestClinicAccess.clinicOrgId, membership.orgId)
        )
      )
      .leftJoin(
        proposals,
        and(
          eq(proposals.requestId, requests.id),
          eq(proposals.clinicOrgId, membership.orgId)
        )
      )
      .leftJoin(user, eq(user.id, requests.createdByUserId))
      .where(eq(requests.status, "open"))
      .orderBy(requests.createdAt);

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

  // ── Dispatcher view ────────────────────────────────────────────────────────
  const rows = await db
    .select({
      id: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      postcode: requests.postcode,
      createdAt: requests.createdAt,
      creatorName: user.name,
      creatorEmail: user.email,
      clinicsContacted: sql<number>`(
        SELECT COUNT(*) FROM request_clinic_access
        WHERE request_clinic_access.request_id = ${requests.id}
      )`.mapWith(Number),
      proposalCount: sql<number>`(
        SELECT COUNT(*) FROM proposals
        WHERE proposals.request_id = ${requests.id}
      )`.mapWith(Number),
    })
    .from(requests)
    .leftJoin(user, eq(user.id, requests.createdByUserId))
    .where(
      and(
        eq(requests.dispatcherOrgId, membership.orgId),
        eq(requests.status, "open")
      )
    )
    .orderBy(desc(requests.createdAt));

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
