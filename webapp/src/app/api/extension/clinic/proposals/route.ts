import {
  ExtensionClinicProposalsResponseSchema,
  type ExtensionClinicProposalsResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import {
  isExtensionBearerAuthError,
  requireExtensionBearerAuth,
} from "@/lib/extension-api/require-extension-bearer.server";
import { getMembershipForRequest } from "@/lib/membership";
import { mapClinicRowsToProposalRows } from "@/server/proposals/load-proposals-page";
import { listProposalsForClinic } from "@/server/proposals/proposals-rls-queries";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireExtensionBearerAuth(request.headers);
  if (isExtensionBearerAuthError(auth)) {
    return auth.error;
  }

  const membership = await getMembershipForRequest(auth.userId);
  if (!membership || membership.orgType !== "clinic") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listProposalsForClinic(
    { userId: auth.userId, orgId: membership.orgId },
    membership.orgId,
  );

  const pendingRows = rows.filter((r) => r.status === "pending");

  const items: ExtensionClinicProposalsResponse["items"] = pendingRows.map(
    (row) => {
      const [mapped] = mapClinicRowsToProposalRows([row]);
      return {
        ...mapped,
        requestId: row.requestId,
        status: "pending" as const,
      };
    },
  );

  const body: ExtensionClinicProposalsResponse = { items };

  const parsed = v.safeParse(ExtensionClinicProposalsResponseSchema, body);
  if (!parsed.success) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json(parsed.output satisfies ExtensionClinicProposalsResponse);
}
