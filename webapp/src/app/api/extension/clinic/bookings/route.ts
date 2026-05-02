import {
  ExtensionClinicBookingsResponseSchema,
  type ExtensionClinicBookingsResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import {
  isExtensionBearerAuthError,
  requireExtensionBearerAuth,
} from "@/lib/extension-api/require-extension-bearer.server";
import { getMembershipForRequest } from "@/lib/membership";
import { mapClinicRowsToItems } from "@/server/bookings/load-bookings-page";
import { listBookingsForClinic } from "@/server/bookings/bookings-rls-queries";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireExtensionBearerAuth(request.headers);
  if (isExtensionBearerAuthError(auth)) {
    return auth.error;
  }

  const membership = await getMembershipForRequest(auth.userId);
  if (!membership || membership.orgType !== "clinic") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const todayIso = now.toISOString();

  const rows = await listBookingsForClinic(
    { userId: auth.userId, orgId: membership.orgId },
    membership.orgId,
  );

  const body: ExtensionClinicBookingsResponse = {
    items: mapClinicRowsToItems(rows),
    todayIso,
  };

  const parsed = v.safeParse(ExtensionClinicBookingsResponseSchema, body);
  if (!parsed.success) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json(parsed.output satisfies ExtensionClinicBookingsResponse);
}
