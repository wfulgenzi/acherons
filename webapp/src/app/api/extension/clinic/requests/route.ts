import {
  ExtensionClinicRequestsResponseSchema,
  type ExtensionClinicRequestsResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import {
  isExtensionBearerAuthError,
  requireExtensionBearerAuth,
} from "@/lib/extension-api/require-extension-bearer.server";
import { getMembershipForRequest } from "@/lib/membership";
import { mapClinicRowsToItems } from "@/server/requests/load-requests-page";
import { listClinicAccessibleRequests } from "@/server/requests/requests-rls-queries";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireExtensionBearerAuth(request.headers);
  if (isExtensionBearerAuthError(auth)) {
    return auth.error;
  }

  const membership = await getMembershipForRequest(auth.userId);
  if (!membership || membership.orgType !== "clinic") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await listClinicAccessibleRequests(
    { userId: auth.userId, orgId: membership.orgId },
    membership.orgId,
  );

  const body: ExtensionClinicRequestsResponse = {
    items: mapClinicRowsToItems(rows),
  };

  const parsed = v.safeParse(ExtensionClinicRequestsResponseSchema, body);
  if (!parsed.success) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json(parsed.output satisfies ExtensionClinicRequestsResponse);
}
