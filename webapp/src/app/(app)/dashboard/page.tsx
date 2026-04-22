import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { memberships, organisations } from "@/db/schema";
import { ClinicDashboard } from "./_clinic/ClinicDashboard";
import { DispatcherDashboard } from "./_dispatcher/DispatcherDashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const rows = await db
    .select()
    .from(memberships)
    .innerJoin(organisations, eq(memberships.orgId, organisations.id))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  const row = rows[0];
  if (!row) redirect("/onboarding");

  const { organisations: org } = row;

  if (org.type === "clinic") {
    return (
      <ClinicDashboard
        orgId={org.id}
        orgName={org.name}
        userName={session.user.name ?? null}
      />
    );
  }

  return (
    <DispatcherDashboard
      orgId={org.id}
      orgName={org.name}
      userName={session.user.name ?? null}
    />
  );
}
