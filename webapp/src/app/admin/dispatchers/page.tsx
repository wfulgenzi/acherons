import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { count, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { organisations, memberships } from "@/db/schema";
import { DispatchersTable, type DispatcherRow } from "./DispatchersTable";

export default async function DispatchersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) redirect("/dashboard");

  const [rows, memberCounts] = await Promise.all([
    db
      .select()
      .from(organisations)
      .where(eq(organisations.type, "dispatch"))
      .orderBy(organisations.name),
    db
      .select({ orgId: memberships.orgId, count: count() })
      .from(memberships)
      .groupBy(memberships.orgId),
  ]);

  const countMap = Object.fromEntries(memberCounts.map((r) => [r.orgId, r.count]));

  const data: DispatcherRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    memberCount: countMap[r.id] ?? 0,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispatchers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} total</p>
        </div>
        <Link
          href="/admin/dispatchers/new"
          className={buttonVariants({ variant: "primary" })}
        >
          + New dispatcher
        </Link>
      </div>

      <DispatchersTable data={data} />
    </div>
  );
}
