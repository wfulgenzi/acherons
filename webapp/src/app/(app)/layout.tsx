import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { OrgProvider } from "@/lib/org-context";
import { Sidebar } from "@/components/Sidebar";

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
        <main className="flex-1 overflow-auto">{children}</main>
      </OrgProvider>
    </div>
  );
}
