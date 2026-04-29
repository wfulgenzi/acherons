import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { CreateProposalSchema } from "@acherons/contracts";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { createInboxNotification } from "@/lib/notifications/emit.server";
import { createClinicProposalForRequest } from "@/server/proposals/proposals-rls-queries";

export async function POST(request: NextRequest) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }
  const { userId, membership } = apiAuth;
  if (membership.orgType !== "clinic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(CreateProposalSchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { requestId, proposedTimeslots, notes } = parsed.output;

  const result = await createClinicProposalForRequest(
    { userId, orgId: membership.orgId },
    {
      requestId,
      proposedTimeslots,
      notes: notes ?? null,
      createdByUserId: userId,
    },
  );

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  await createInboxNotification(result.dispatcherOrgId, "proposal.created", {
    requestId: result.requestId,
    proposalId: result.id,
  });

  return NextResponse.json({ id: result.id }, { status: 201 });
}
