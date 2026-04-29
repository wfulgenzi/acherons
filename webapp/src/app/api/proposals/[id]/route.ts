import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { createInboxNotification } from "@/lib/notifications/emit.server";
import { executeDispatcherProposalAction } from "@/server/proposals/proposals-rls-queries";

type RouteContext = { params: Promise<{ id: string }> };

const ActionSchema = v.object({
  action: v.picklist(["accept", "refuse"]),
});

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
  const parsed = v.safeParse(ActionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { action } = parsed.output;

  const result = await executeDispatcherProposalAction(
    { userId, orgId: membership.orgId },
    id,
    action,
  );

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  if (result.outcome === "refused") {
    await createInboxNotification(result.clinicOrgId, "proposal.declined", {
      requestId: result.requestId,
      proposalId: result.proposalId,
    });
  } else {
    await createInboxNotification(result.clinicOrgId, "booking.created", {
      requestId: result.requestId,
      bookingId: result.bookingId,
    });
  }

  return NextResponse.json({ ok: true });
}
