import type { ExtensionMeResponse } from "@acherons/contracts";
import {
  isExtensionBearerAuthError,
  requireExtensionBearerAuth,
} from "@/lib/extension-api/require-extension-bearer.server";
import { getMembershipForRequest } from "@/lib/membership";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireExtensionBearerAuth(request.headers);
  if (isExtensionBearerAuthError(auth)) {
    return auth.error;
  }

  const membership = await getMembershipForRequest(auth.userId);

  const body: ExtensionMeResponse = {
    membership:
      membership === null
        ? null
        : {
            orgId: membership.orgId,
            orgName: membership.orgName,
            orgType: membership.orgType,
            role: membership.role,
          },
  };

  return Response.json(body);
}
