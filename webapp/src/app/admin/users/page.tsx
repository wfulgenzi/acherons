import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadAdminUsersListPageData } from "@/server/admin/users/load-admin-users-list-page";
import { UsersTable } from "./UsersTable";

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const { rows: data } = await loadAdminUsersListPageData();

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
