import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { memberships, organisations, clinicProfiles } from "@/db/schema";
import { NewRequestFlow, type ClinicItem } from "./NewRequestFlow";

export default async function NewRequestPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Only dispatchers can create requests
  const memberRows = await db
    .select({ orgType: organisations.type })
    .from(memberships)
    .innerJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  if (!memberRows[0] || memberRows[0].orgType !== "dispatch") {
    redirect("/dashboard");
  }

  // Pre-fetch all clinics with their profiles
  const clinicRows = await db
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
