import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { adminDb } from "@/db";
import { orgsRepo, membershipsRepo } from "@/db/repositories";
import { DispatchersTable, type DispatcherRow } from "./DispatchersTable";

export default async function DispatchersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const [rows, memberCounts] = await Promise.all([
    orgsRepo.findAllByType(adminDb, "dispatch"),
    membershipsRepo.memberCountsByOrg(adminDb),
  ]);

  const countMap = Object.fromEntries(
    memberCounts.map((r) => [r.orgId, r.count]),
  );

  const data: DispatcherRow[] = rows.map((r) => ({
    id: r.organisations.id,
    name: r.organisations.name,
    memberCount: countMap[r.organisations.id] ?? 0,
    createdAt: r.organisations.createdAt.toISOString(),
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
