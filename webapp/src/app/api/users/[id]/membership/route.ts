import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { AdminAssignMembershipSchema } from "@acherons/contracts";
import { requireAdmin, isApiError } from "@/lib/api";
import {
  adminAssignUserToOrg,
  adminRemoveUserMembership,
} from "@/server/admin/queries/admin-memberships-queries";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// POST /api/users/:id/membership — assign user to an org (admin only)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id: userId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(AdminAssignMembershipSchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }
  const { orgId, role } = parsed.output;

  const outcome = await adminAssignUserToOrg(userId, orgId, role);
  if (!outcome.ok) {
    if (outcome.reason === "user_not_found") {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Organisation not found." },
      { status: 404 },
    );
  }

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

  const outcome = await adminRemoveUserMembership(userId);
  if (!outcome.ok) {
    return NextResponse.json(
      { error: "No membership found." },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
