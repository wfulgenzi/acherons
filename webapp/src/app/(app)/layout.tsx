import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { membershipsRepo } from "@/db/repositories";
import { withUserContext } from "@/db/rls";
import { OrgProvider } from "@/lib/org-context";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  if (session.user.isAdmin) redirect("/admin");

  const row = await withUserContext(session.user.id, (tx) =>
    membershipsRepo.findByUserIdWithOrg(tx, session.user.id)
  );
  if (!row) redirect("/onboarding");

  const { memberships: membership, organisations: org } = row;

  return (
    <div className="flex min-h-screen bg-brand-100">
      <Sidebar
        orgType={org.type}
        orgName={org.name}
        isAdmin={session.user.isAdmin ?? false}
        userEmail={session.user.email}
        userName={session.user.name ?? null}
      />
      <OrgProvider
        value={{
          orgId: org.id,
          orgName: org.name,
          orgType: org.type,
          membershipRole: membership.role,
        }}
      >
        <main className="flex-1 overflow-auto">{children}</main>
      </OrgProvider>
    </div>
  );
}
