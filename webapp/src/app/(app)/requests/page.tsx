import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadRequestsPageData } from "@/server/requests/load-requests-page";
import { DispatcherRequestsView } from "./_dispatcher/DispatcherRequestsView";
import { ClinicRequestsView } from "./_clinic/ClinicRequestsView";

export default async function RequestsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadRequestsPageData(session.user.id);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  if (result.kind === "clinic") {
    return <ClinicRequestsView items={result.items} />;
  }

  return <DispatcherRequestsView data={result.data} />;
}
