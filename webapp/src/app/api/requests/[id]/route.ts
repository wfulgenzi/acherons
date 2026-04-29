import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { PatchDispatcherRequestSchema } from "@acherons/contracts";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { patchDispatcherRequestForOrg } from "@/server/requests/requests-rls-queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }
  const { userId, membership } = apiAuth;
  if (membership.orgType !== "dispatch") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(PatchDispatcherRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { caseDescription, clinicIds } = parsed.output;

  const found = await patchDispatcherRequestForOrg(
    { userId, orgId: membership.orgId },
    id,
    { caseDescription, clinicIds },
  );

  if (!found) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
