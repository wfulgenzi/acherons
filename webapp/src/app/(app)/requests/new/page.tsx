import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadNewRequestPageData } from "@/server/requests/load-new-request-page";
import { NewRequestFlow } from "./NewRequestFlow";

export default async function NewRequestPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadNewRequestPageData(session.user.id);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  return <NewRequestFlow clinics={result.clinics} />;
}
