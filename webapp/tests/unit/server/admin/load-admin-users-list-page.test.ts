import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/users/admin-users-queries", () => ({
  loadAdminUsersListPage: vi.fn(),
}));

import { loadAdminUsersListPage } from "@/server/admin/users/admin-users-queries";
import {
  loadAdminUsersListPageData,
  mapAdminUserListRowsToUserRows,
} from "@/server/admin/users/load-admin-users-list-page";

describe("mapAdminUserListRowsToUserRows", () => {
  it("maps joined user rows to UserRow", () => {
    const created = new Date("2026-05-01T00:00:00.000Z");
    expect(
      mapAdminUserListRowsToUserRows([
        {
          user: {
            id: "u1",
            name: "N",
            email: "n@x.com",
            emailVerified: true,
            image: null,
            isAdmin: true,
            createdAt: created,
            updatedAt: created,
          },
          memberships: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            userId: "u1",
            orgId: "o1",
            role: "admin",
            createdAt: created,
          },
          organisations: {
            id: "o1",
            name: "Org",
            type: "clinic",
            createdAt: created,
            updatedAt: created,
          },
        },
      ]),
    ).toEqual([
      {
        id: "u1",
        name: "N",
        email: "n@x.com",
        isAdmin: true,
        orgName: "Org",
        orgType: "clinic",
        membershipRole: "admin",
        createdAt: created.toISOString(),
      },
    ]);
  });
});

describe("loadAdminUsersListPageData", () => {
  const mocked = vi.mocked(loadAdminUsersListPage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delegates to admin users query and maps", async () => {
    const created = new Date("2026-05-10T00:00:00.000Z");
    mocked.mockResolvedValueOnce([
      {
        user: {
          id: "u2",
          name: "Solo",
          email: "solo@x.com",
          emailVerified: false,
          image: null,
          isAdmin: false,
          createdAt: created,
          updatedAt: created,
        },
        memberships: null,
        organisations: null,
      },
    ]);

    await expect(loadAdminUsersListPageData()).resolves.toEqual({
      rows: [
        {
          id: "u2",
          name: "Solo",
          email: "solo@x.com",
          isAdmin: false,
          orgName: null,
          orgType: null,
          membershipRole: null,
          createdAt: created.toISOString(),
        },
      ],
    });
    expect(mocked).toHaveBeenCalledTimes(1);
  });
});
