import "server-only";

import type { UserRow } from "@/app/admin/users/UsersTable";
import { loadAdminUsersListPage } from "@/server/admin/queries/admin-users-queries";

type ListRow = Awaited<ReturnType<typeof loadAdminUsersListPage>>[number];

export function mapAdminUserListRowsToUserRows(rows: ListRow[]): UserRow[] {
  return rows.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    isAdmin: r.user.isAdmin ?? false,
    orgName: r.organisations?.name ?? null,
    orgType: r.organisations?.type ?? null,
    membershipRole: r.memberships?.role ?? null,
    createdAt: r.user.createdAt.toISOString(),
  }));
}

export async function loadAdminUsersListPageData(): Promise<{
  rows: UserRow[];
}> {
  const raw = await loadAdminUsersListPage();
  return { rows: mapAdminUserListRowsToUserRows(raw) };
}
