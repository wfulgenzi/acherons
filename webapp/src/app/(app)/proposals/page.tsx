import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadProposalsPageData } from "@/server/proposals/load-proposals-page";
import { ClinicProposalsView } from "./_clinic/ClinicProposalsView";
import { DispatcherProposalsView } from "./_dispatcher/DispatcherProposalsView";

export default async function ProposalsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadProposalsPageData(session.user.id);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  if (result.kind === "clinic") {
    return <ClinicProposalsView data={result.data} />;
  }

  return <DispatcherProposalsView data={result.data} />;
}
