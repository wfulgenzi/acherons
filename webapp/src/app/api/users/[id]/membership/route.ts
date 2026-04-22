import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { memberships, user, organisations } from "@/db/schema";
import { requireAdmin, isApiError } from "@/lib/api";

type RouteContext = { params: Promise<{ id: string }> };

const AssignSchema = v.object({
  orgId: v.pipe(v.string(), v.minLength(1)),
  role: v.optional(v.picklist(["member", "admin"]), "member"),
});

// ---------------------------------------------------------------------------
// POST /api/users/:id/membership — assign user to an org (admin only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const { id: userId } = await params;

  // Verify user exists
  const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!targetUser[0]) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Parse + validate body
  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(AssignSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { orgId, role } = parsed.output;

  // Verify org exists
  const org = await db.select().from(organisations).where(eq(organisations.id, orgId)).limit(1);
  if (!org[0]) {
    return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
  }

  // Upsert: if membership already exists, update it; otherwise insert
  const existing = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(memberships)
      .set({ orgId, role })
      .where(eq(memberships.userId, userId));
  } else {
    await db.insert(memberships).values({ userId, orgId, role });
  }

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// DELETE /api/users/:id/membership — remove user from their org (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const { id: userId } = await params;

  const existing = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: "No membership found." }, { status: 404 });
  }

  await db.delete(memberships).where(eq(memberships.userId, userId));

  return new NextResponse(null, { status: 204 });
}
