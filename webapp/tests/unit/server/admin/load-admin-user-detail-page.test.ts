import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/queries/admin-users-queries", () => ({
  loadAdminUserDetailPage: vi.fn(),
}));

import { loadAdminUserDetailPage } from "@/server/admin/users/admin-users-queries";
import { loadAdminUserDetailPageData } from "@/server/admin/users/load-admin-user-detail-page";

type UserDetailPayload = Awaited<ReturnType<typeof loadAdminUserDetailPage>>;

describe("loadAdminUserDetailPageData", () => {
  const mocked = vi.mocked(loadAdminUserDetailPage);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when user does not exist", async () => {
    mocked.mockResolvedValueOnce({
      u: null,
      membershipRow: null,
      allOrgs: [],
    } as unknown as UserDetailPayload);
    await expect(loadAdminUserDetailPageData("nope")).resolves.toEqual({
      kind: "not_found",
    });
  });

  it("maps user, membership, and org options", async () => {
    const created = new Date("2026-07-01T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      u: {
        id: "u1",
        name: "Alex",
        email: "a@x.com",
        emailVerified: true,
        image: null,
        isAdmin: false,
        createdAt: created,
        updatedAt: created,
      },
      membershipRow: {
        memberships: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          userId: "u1",
          orgId: "o1",
          role: "member",
          createdAt: created,
        },
        organisations: {
          id: "o1",
          name: "Clinic Z",
          type: "clinic",
          createdAt: created,
          updatedAt: created,
        },
      },
      allOrgs: [
        { id: "o1", name: "Clinic Z", type: "clinic" },
        { id: "o2", name: "Disp Z", type: "dispatch" },
      ],
    });

    await expect(loadAdminUserDetailPageData("u1")).resolves.toEqual({
      kind: "ok",
      user: {
        id: "u1",
        name: "Alex",
        email: "a@x.com",
        isAdmin: false,
        createdAt: created,
      },
      membership: {
        orgId: "o1",
        orgName: "Clinic Z",
        orgType: "clinic",
        role: "member",
      },
      orgOptions: [
        { id: "o1", name: "Clinic Z", type: "clinic" },
        { id: "o2", name: "Disp Z", type: "dispatch" },
      ],
    });
  });

  it("returns null membership when user has no org row", async () => {
    const created = new Date("2026-07-02T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      u: {
        id: "u3",
        name: "Orphan",
        email: "orphan@x.com",
        emailVerified: false,
        image: null,
        isAdmin: false,
        createdAt: created,
        updatedAt: created,
      },
      membershipRow: null,
      allOrgs: [],
    } as unknown as UserDetailPayload);

    await expect(loadAdminUserDetailPageData("u3")).resolves.toEqual({
      kind: "ok",
      user: {
        id: "u3",
        name: "Orphan",
        email: "orphan@x.com",
        isAdmin: false,
        createdAt: created,
      },
      membership: null,
      orgOptions: [],
    });
  });
});
