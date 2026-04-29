import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadEditRequestPageData } from "@/server/requests/load-edit-request-page";
import { EditRequestFlow } from "./EditRequestFlow";

type RouteContext = { params: Promise<{ id: string }> };

export default async function EditRequestPage({ params }: RouteContext) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadEditRequestPageData(session.user.id, id);
  if (result.kind === "redirect") {
    redirect(result.to);
  }
  if (result.kind === "notFound") {
    notFound();
  }

  return (
    <EditRequestFlow
      requestId={result.requestId}
      initialDescription={result.initialDescription}
      initialSelectedClinicIds={result.initialSelectedClinicIds}
      postcode={result.postcode}
      clinics={result.clinics}
    />
  );
}
