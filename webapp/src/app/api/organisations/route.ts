import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { requireAdmin, isApiError } from "@/lib/api";
import { CreateOrganisationSchema } from "@acherons/contracts";
import {
  createOrganisationFromAdminInput,
  listOrganisationsFormattedForApi,
} from "@/server/admin/queries/admin-organisations-queries";

// ---------------------------------------------------------------------------
// GET /api/organisations — public
// ---------------------------------------------------------------------------

export async function GET() {
  const payload = await listOrganisationsFormattedForApi();
  return NextResponse.json(payload);
}

// ---------------------------------------------------------------------------
// POST /api/organisations — admin only
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = v.safeParse(CreateOrganisationSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: v.flatten(result.issues) },
      { status: 400 },
    );
  }

  const responseBody = await createOrganisationFromAdminInput(result.output);

  return NextResponse.json(responseBody, {
    status: 201,
  });
}
