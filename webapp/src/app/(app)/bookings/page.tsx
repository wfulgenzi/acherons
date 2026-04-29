import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { loadBookingsPageData } from "@/server/bookings/load-bookings-page";
import { DispatcherBookingsView } from "./_dispatcher/DispatcherBookingsView";
import { ClinicBookingsView } from "./_clinic/ClinicBookingsView";

export default async function BookingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const result = await loadBookingsPageData(session.user.id);
  if (result.kind === "redirect") {
    redirect(result.to);
  }

  const today = result.todayIso;

  if (result.kind === "clinic") {
    return <ClinicBookingsView items={result.items} today={today} />;
  }

  return <DispatcherBookingsView data={result.data} today={today} />;
}
