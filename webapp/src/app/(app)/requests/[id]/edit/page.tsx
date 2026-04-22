import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  requests,
  requestClinicAccess,
  organisations,
  clinicProfiles,
  memberships,
} from "@/db/schema";
import { EditRequestFlow, type EditClinicItem } from "./EditRequestFlow";

type RouteContext = { params: Promise<{ id: string }> };

export default async function EditRequestPage({ params }: RouteContext) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberRows = await db
    .select({ orgId: memberships.orgId, orgType: organisations.type })
    .from(memberships)
    .innerJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  const membership = memberRows[0];
  if (!membership || membership.orgType !== "dispatch") redirect("/dashboard");

  const [req] = await db
    .select()
    .from(requests)
    .where(and(eq(requests.id, id), eq(requests.dispatcherOrgId, membership.orgId)))
    .limit(1);

  if (!req) notFound();
  if (req.status !== "open") redirect(`/requests/${id}`);

  // All clinics (for selection)
  const allClinicRows = await db
    .select({
      id: organisations.id,
      name: organisations.name,
      address: clinicProfiles.address,
      phone: clinicProfiles.phone,
      latitude: clinicProfiles.latitude,
      longitude: clinicProfiles.longitude,
      openingHours: clinicProfiles.openingHours,
    })
    .from(organisations)
    .innerJoin(clinicProfiles, eq(clinicProfiles.orgId, organisations.id))
    .where(eq(organisations.type, "clinic"))
    .orderBy(organisations.name);

  // Currently selected clinic IDs
  const accessRows = await db
    .select({ clinicOrgId: requestClinicAccess.clinicOrgId })
    .from(requestClinicAccess)
    .where(eq(requestClinicAccess.requestId, id));

  const selectedClinicIds = accessRows.map((r) => r.clinicOrgId);

  const clinics: EditClinicItem[] = allClinicRows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    phone: r.phone ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    openingHours: r.openingHours ?? null,
  }));

  return (
    <EditRequestFlow
      requestId={id}
      initialDescription={req.caseDescription}
      initialSelectedClinicIds={selectedClinicIds}
      postcode={req.postcode}
      clinics={clinics}
    />
  );
}
