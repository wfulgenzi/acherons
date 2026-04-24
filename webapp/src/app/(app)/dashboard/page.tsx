import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { membershipsRepo } from "@/db/repositories";
import { withUserContext } from "@/db/rls";
import { ClinicDashboard } from "./_clinic/ClinicDashboard";
import { DispatcherDashboard } from "./_dispatcher/DispatcherDashboard";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const row = await withUserContext(session.user.id, (tx) =>
    membershipsRepo.findByUserIdWithOrg(tx, session.user.id)
  );
  if (!row) redirect("/onboarding");

  const { organisations: org } = row;

  if (org.type === "clinic") {
    return (
      <ClinicDashboard
        orgId={org.id}
        orgName={org.name}
        userId={session.user.id}
        userName={session.user.name ?? null}
      />
    );
  }

  return (
    <DispatcherDashboard
      orgId={org.id}
      orgName={org.name}
      userId={session.user.id}
      userName={session.user.name ?? null}
    />
  );
}
