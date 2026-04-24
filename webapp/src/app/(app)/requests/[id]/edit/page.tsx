import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { requestsRepo, rcaRepo, orgsRepo } from "@/db/repositories";
import { EditRequestFlow, type EditClinicItem } from "./EditRequestFlow";

type RouteContext = { params: Promise<{ id: string }> };

export default async function EditRequestPage({ params }: RouteContext) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const membership = await getMembership(session.user.id);
  if (!membership || membership.orgType !== "dispatch") redirect("/dashboard");

  const [req, allClinicRows, selectedClinicIds] = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    async (tx) =>
      Promise.all([
        requestsRepo.findByIdForDispatcher(tx, id, membership.orgId),
        orgsRepo.findAllClinics(tx),
        rcaRepo.findClinicIdsByRequestId(tx, id),
      ])
  );

  if (!req) notFound();
  if (req.status !== "open") redirect(`/requests/${id}`);

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
