import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { loadAdminDispatchersListPageData } from "@/server/admin/dispatchers/load-admin-dispatchers-list-page";
import { DispatchersTable } from "./DispatchersTable";

export default async function DispatchersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const { rows: data } = await loadAdminDispatchersListPageData();

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
