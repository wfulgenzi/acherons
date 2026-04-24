import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { orgsRepo } from "@/db/repositories";
import { NewRequestFlow, type ClinicItem } from "./NewRequestFlow";

export default async function NewRequestPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const membership = await getMembership(session.user.id);
  if (!membership || membership.orgType !== "dispatch") {
    redirect("/dashboard");
  }

  const clinicRows = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => orgsRepo.findAllClinics(tx),
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
