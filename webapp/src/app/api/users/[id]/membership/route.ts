import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { adminDb, asAdminDb } from "@/db";
import { requireAdmin, isApiError } from "@/lib/api";
import {
  adminMembershipsRepo,
  adminOrgsRepo,
  adminUsersRepo,
} from "@/db/repositories";

type RouteContext = { params: Promise<{ id: string }> };

const adb = asAdminDb(adminDb);

const AssignSchema = v.object({
  orgId: v.pipe(v.string(), v.minLength(1)),
  role: v.optional(v.picklist(["member", "admin"]), "member"),
});

// ---------------------------------------------------------------------------
// POST /api/users/:id/membership — assign user to an org (admin only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id: userId } = await params;

  const targetUser = await adminUsersRepo.findById(adb, userId);
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(AssignSchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const { orgId, role } = parsed.output;

  const org = await adminOrgsRepo.findById(adb, orgId);
  if (!org) {
    return NextResponse.json(
      { error: "Organisation not found." },
      { status: 404 },
    );
  }

  await adminMembershipsRepo.upsertForUser(adb, userId, orgId, role);

  return NextResponse.json({ ok: true });
}

// ---------------------------------------------------------------------------
// DELETE /api/users/:id/membership — remove user from their org (admin only)
// ---------------------------------------------------------------------------

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id: userId } = await params;

  const deleted = await adminMembershipsRepo.deleteByUserId(adb, userId);
  if (!deleted) {
    return NextResponse.json(
      { error: "No membership found." },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
