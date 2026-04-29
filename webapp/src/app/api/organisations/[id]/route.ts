import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { requireAdmin, isApiError } from "@/lib/api";
import { UpdateOrganisationSchema } from "@/lib/schemas/organisations";
import {
  deleteOrganisationAsAdmin,
  getOrganisationFormattedById,
  updateOrganisationFromAdminInput,
} from "@/server/admin/queries/admin-organisations-queries";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/organisations/:id — public
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await getOrganisationFormattedById(id);

  if (!body) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(body);
}

// ---------------------------------------------------------------------------
// PATCH /api/organisations/:id — admin only
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id } = await params;

  const rawBody = await request.json().catch(() => null);
  if (rawBody === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = v.safeParse(UpdateOrganisationSchema, rawBody);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: v.flatten(result.issues) },
      { status: 400 },
    );
  }

  const updated = await updateOrganisationFromAdminInput(id, result.output);
  if (!updated.ok) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(updated.body);
}

// ---------------------------------------------------------------------------
// DELETE /api/organisations/:id — admin only
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id } = await params;

  const deleted = await deleteOrganisationAsAdmin(id);
  if (!deleted) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
