/**
 * Seeds two dispatcher orgs + two users (one membership each) and one open request
 * owned by org A. Uses {@link adminDb} so RLS is bypassed — tests assert RLS via `db` +
 * {@link withRLS}.
 */
import { adminDb } from "@/db";
import { memberships, organisations, requests, user } from "@/db/schema";

/** Stable UUIDs so fixtures are easy to grep / debug. */
export const DISPATCH_ORG_A_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
export const DISPATCH_ORG_B_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

export const RLS_SEED_USER_A = "rls_seed_dispatcher_user_a";
export const RLS_SEED_USER_B = "rls_seed_dispatcher_user_b";

export type DispatcherRlsFixture = {
  orgA: string;
  orgB: string;
  userA: string;
  userB: string;
  requestId: string;
};

export async function seedTwoDispatchersAndRequestInOrgA(): Promise<DispatcherRlsFixture> {
  const now = new Date();
  await adminDb.insert(organisations).values([
    {
      id: DISPATCH_ORG_A_ID,
      name: "RLS Test Dispatch A",
      type: "dispatch",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: DISPATCH_ORG_B_ID,
      name: "RLS Test Dispatch B",
      type: "dispatch",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await adminDb.insert(user).values([
    {
      id: RLS_SEED_USER_A,
      name: "RLS User A",
      email: "rls-seed-user-a@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: RLS_SEED_USER_B,
      name: "RLS User B",
      email: "rls-seed-user-b@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await adminDb.insert(memberships).values([
    {
      userId: RLS_SEED_USER_A,
      orgId: DISPATCH_ORG_A_ID,
      role: "admin",
    },
    {
      userId: RLS_SEED_USER_B,
      orgId: DISPATCH_ORG_B_ID,
      role: "admin",
    },
  ]);

  const [row] = await adminDb
    .insert(requests)
    .values({
      dispatcherOrgId: DISPATCH_ORG_A_ID,
      createdByUserId: RLS_SEED_USER_A,
      patientGender: "unknown",
      patientAge: 42,
      postcode: "RLS 1XY",
      caseDescription: "Integration RLS seed request",
    })
    .returning({ id: requests.id });

  return {
    orgA: DISPATCH_ORG_A_ID,
    orgB: DISPATCH_ORG_B_ID,
    userA: RLS_SEED_USER_A,
    userB: RLS_SEED_USER_B,
    requestId: row.id,
  };
}
