import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { OrgProvider } from "@/lib/org-context";
import { NotificationsProvider } from "@/providers";
import { loadInitialNotifications } from "@/lib/notifications/load-initial";
import { AppHeaderBar } from "@/components/AppHeaderBar";
import { PageHeaderProvider } from "@/lib/page-header-context";
import { Sidebar } from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  if (session.user.isAdmin) {
    redirect("/admin");
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    redirect("/onboarding");
  }

  const initialNotifications = await loadInitialNotifications(
    session.user.id,
    membership.orgId,
  );

  return (
    <div className="flex min-h-screen bg-brand-100">
      <Sidebar
        orgType={membership.orgType}
        orgName={membership.orgName}
        isAdmin={session.user.isAdmin ?? false}
        userEmail={session.user.email}
        userName={session.user.name ?? null}
      />
      <OrgProvider
        value={{
          orgId: membership.orgId,
          orgName: membership.orgName,
          orgType: membership.orgType,
          membershipRole: membership.role,
        }}
      >
        <NotificationsProvider initialItems={initialNotifications}>
          <PageHeaderProvider>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <AppHeaderBar />
              <main className="min-h-0 flex-1 overflow-auto">{children}</main>
            </div>
          </PageHeaderProvider>
        </NotificationsProvider>
      </OrgProvider>
    </div>
  );
}
