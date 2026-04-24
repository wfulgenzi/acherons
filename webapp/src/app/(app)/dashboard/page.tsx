import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { ClinicDashboard } from "./_clinic/ClinicDashboard";
import { DispatcherDashboard } from "./_dispatcher/DispatcherDashboard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    redirect("/onboarding");
  }

  if (membership.orgType === "clinic") {
    return (
      <ClinicDashboard
        orgId={membership.orgId}
        orgName={membership.orgName}
        userId={session.user.id}
        userName={session.user.name ?? null}
      />
    );
  }

  return (
    <DispatcherDashboard
      orgId={membership.orgId}
      orgName={membership.orgName}
      userId={session.user.id}
      userName={session.user.name ?? null}
    />
  );
}
