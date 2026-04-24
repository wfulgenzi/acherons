import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { adminDb } from "@/db";
import { user, memberships, organisations } from "@/db/schema";
import { UsersTable, type UserRow } from "./UsersTable";

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) redirect("/dashboard");

  const rows = await adminDb
    .select()
    .from(user)
    .leftJoin(memberships, eq(memberships.userId, user.id))
    .leftJoin(organisations, eq(organisations.id, memberships.orgId))
    .orderBy(user.createdAt);

  const data: UserRow[] = rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    isAdmin: r.user.isAdmin ?? false,
    orgName: r.organisations?.name ?? null,
    orgType: r.organisations?.type ?? null,
    membershipRole: r.memberships?.role ?? null,
    createdAt: r.user.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} total</p>
        </div>
      </div>

      <UsersTable data={data} currentUserId={session.user.id} />
    </div>
  );
}
