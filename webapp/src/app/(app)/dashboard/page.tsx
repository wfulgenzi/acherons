import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadDashboardPageData } from "@/server/dashboard/load-dashboard-page";
import { ClinicDashboard } from "./_clinic/ClinicDashboard";
import { DispatcherDashboard } from "./_dispatcher/DispatcherDashboard";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadDashboardPageData(
    session.user.id,
    session.user.name ?? null,
  );
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  if (result.kind === "clinic") {
    return <ClinicDashboard {...result.data} />;
  }

  return <DispatcherDashboard {...result.data} />;
}
