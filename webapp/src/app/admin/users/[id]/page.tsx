import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { adminDb } from "@/db";
import { user, memberships, organisations } from "@/db/schema";
import { orgsRepo } from "@/db/repositories";
import { MembershipManager, type CurrentMembership, type OrgOption } from "./MembershipManager";
import { Badge } from "@/components/ui/Badge";

type Props = { params: Promise<{ id: string }> };

export default async function UserDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) redirect("/dashboard");

  const [userRows, membershipRows, allOrgs] = await Promise.all([
    adminDb.select().from(user).where(eq(user.id, id)).limit(1),
    adminDb
      .select()
      .from(memberships)
      .leftJoin(organisations, eq(organisations.id, memberships.orgId))
      .where(eq(memberships.userId, id))
      .limit(1),
    orgsRepo.findAllSummary(adminDb),
  ]);

  const u = userRows[0];
  if (!u) notFound();

  const membershipRow = membershipRows[0] ?? null;
  const membership: CurrentMembership | null = membershipRow?.organisations
    ? {
        orgId: membershipRow.organisations.id,
        orgName: membershipRow.organisations.name,
        orgType: membershipRow.organisations.type,
        role: membershipRow.memberships.role,
      }
    : null;

  const orgOptions: OrgOption[] = allOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
  }));

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to users
        </Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-10 h-10 rounded-full bg-brand-200 text-brand-800 text-sm font-bold flex items-center justify-center shrink-0">
            {(u.name || u.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {u.name ?? u.email}
            </h1>
            {u.name && (
              <p className="text-sm text-gray-500">{u.email}</p>
            )}
          </div>
          {u.isAdmin && (
            <Badge variant="brand" className="ml-1">Admin</Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <InfoCard title="Account">
          <InfoRow label="Name" value={u.name} />
          <InfoRow label="Email" value={u.email} />
          <InfoRow
            label="Created"
            value={u.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <InfoRow label="Admin" value={u.isAdmin ? "Yes" : "No"} />
        </InfoCard>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Organisation</h2>
          </div>
          <div className="px-5 py-4">
            <MembershipManager
              userId={u.id}
              membership={membership}
              allOrgs={orgOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex px-5 py-3.5 gap-4">
      <dt className="text-sm text-gray-500 w-28 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">
        {value ?? <span className="text-gray-400 font-normal">—</span>}
      </dd>
    </div>
  );
}
