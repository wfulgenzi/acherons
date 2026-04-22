import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { memberships, organisations } from "@/db/schema";
import { OrgProvider } from "@/lib/org-context";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Admins always go to the admin panel — skip the org query entirely
  if (session.user.isAdmin) redirect("/admin");

  const rows = await db
    .select()
    .from(memberships)
    .innerJoin(organisations, eq(memberships.orgId, organisations.id))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  const row = rows[0];

  // Regular users with no org go to onboarding
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
