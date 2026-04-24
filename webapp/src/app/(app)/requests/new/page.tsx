import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { withRLS, withUserContext } from "@/db/rls";
import { membershipsRepo, orgsRepo } from "@/db/repositories";
import { NewRequestFlow, type ClinicItem } from "./NewRequestFlow";

export default async function NewRequestPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const membership = await withUserContext(session.user.id, (tx) =>
    membershipsRepo.findByUserId(tx, session.user.id)
  );
  if (!membership || membership.orgType !== "dispatch") redirect("/dashboard");

  const clinicRows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => orgsRepo.findAllClinics(tx)
  );

  const clinics: ClinicItem[] = clinicRows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    phone: r.phone,
    latitude: r.latitude,
    longitude: r.longitude,
    openingHours: r.openingHours ?? null,
  }));

  return <NewRequestFlow clinics={clinics} />;
}
