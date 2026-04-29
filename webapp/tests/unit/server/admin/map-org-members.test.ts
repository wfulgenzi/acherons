import { describe, it, expect } from "vitest";
import { mapMembershipRowsToOrgMemberRows } from "@/server/admin/map-org-members";

describe("mapMembershipRowsToOrgMemberRows", () => {
  it("maps admin member rows to table rows with ISO joinedAt", () => {
    const joined = new Date("2026-03-01T12:00:00.000Z");
    expect(
      mapMembershipRowsToOrgMemberRows([
        {
          userId: "u1",
          name: "Pat",
          email: "p@x.com",
          role: "admin",
          joinedAt: joined,
        },
      ]),
    ).toEqual([
      {
        userId: "u1",
        name: "Pat",
        email: "p@x.com",
        role: "admin",
        joinedAt: joined.toISOString(),
      },
    ]);
  });
});
