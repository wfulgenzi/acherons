import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAdmin, isApiError } from "@/lib/api";
import { membershipsRepo, orgsRepo } from "@/db/repositories";

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

  const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!targetUser[0]) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(AssignSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { orgId, role } = parsed.output;

  const org = await orgsRepo.findById(db, orgId);
  if (!org) {
    return NextResponse.json({ error: "Organisation not found." }, { status: 404 });
  }

  await membershipsRepo.upsertForUser(db, userId, orgId, role);

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// DELETE /api/users/:id/membership — remove user from their org (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const { id: userId } = await params;

  const deleted = await membershipsRepo.deleteByUserId(db, userId);
  if (!deleted) {
    return NextResponse.json({ error: "No membership found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
