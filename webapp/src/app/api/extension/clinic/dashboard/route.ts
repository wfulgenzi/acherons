import {
  ExtensionClinicDashboardResponseSchema,
  type ExtensionClinicDashboardResponse,
} from "@acherons/contracts";
import * as v from "valibot";
import {
  isExtensionBearerAuthError,
  requireExtensionBearerAuth,
} from "@/lib/extension-api/require-extension-bearer.server";
import { labelForNotificationType } from "@/lib/notifications/labels";
import { getMembershipForRequest } from "@/lib/membership";
import type { ClinicDashboardViewProps } from "@/server/dashboard/load-dashboard-page";
import { loadClinicDashboardView } from "@/server/dashboard/load-dashboard-page";
import { findRecentNotificationsForOrg } from "@/server/notifications/notifications-rls-queries";

/** Match bell inbox; filter to rows whose `created_at` is within this window. */
const INBOX_RECENT_MS = 24 * 60 * 60 * 1000;
const INBOX_FETCH_CAP = 100;
const INBOX_RETURN_CAP = 25;

function clinicDashboardToWire(
  d: ClinicDashboardViewProps,
  newItems: ExtensionClinicDashboardResponse["newItems"],
): ExtensionClinicDashboardResponse {
  return {
    newItems,
    statCards: d.statCards,
    newRequestsItems: d.newRequestsItems,
    upcomingBookingsItems: d.upcomingBookingsItems.map((item) => ({
      id: item.id,
      confirmedStart: toIso(item.confirmedStart),
      confirmedEnd: toIso(item.confirmedEnd),
      patientAge: item.patientAge,
      patientGender: item.patientGender,
      caseDescription: item.caseDescription,
    })),
    todayScheduleItems: d.todayScheduleItems.map((item) => ({
      id: item.id,
      confirmedStart: toIso(item.confirmedStart),
      confirmedEnd: toIso(item.confirmedEnd),
      patientAge: item.patientAge,
      caseDescription: item.caseDescription,
    })),
    recentActivityItems: d.recentActivityItems.map((item) => ({
      id: item.id,
      status: item.status,
      createdAt: toIso(item.createdAt),
      patientAge: item.patientAge,
      patientGender: item.patientGender,
    })),
  };
}

function toIso(d: Date): string {
  return d instanceof Date ? d.toISOString() : String(d);
}

function readAtToIso(
  readAt: Date | string | null | undefined,
): string | null {
  if (readAt == null) {
    return null;
  }
  return readAt instanceof Date ? readAt.toISOString() : String(readAt);
}

async function loadNewInboxItems(
  userId: string,
  orgId: string,
  now: Date,
): Promise<ExtensionClinicDashboardResponse["newItems"]> {
  const rows = await findRecentNotificationsForOrg(
    { userId, orgId },
    INBOX_FETCH_CAP,
  );
  const cutoff = now.getTime() - INBOX_RECENT_MS;
  return rows
    .filter((r) => r.createdAt.getTime() >= cutoff)
    .slice(0, INBOX_RETURN_CAP)
    .map((r) => ({
      id: r.id,
      type: r.type,
      readAt: readAtToIso(r.readAt),
      createdAt: r.createdAt.toISOString(),
      label: labelForNotificationType(r.type),
    }));
}

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
  const [view, newItems] = await Promise.all([
    loadClinicDashboardView(auth.userId, membership.orgId, null, now),
    loadNewInboxItems(auth.userId, membership.orgId, now),
  ]);

  const wire = clinicDashboardToWire(view, newItems);
  const parsed = v.safeParse(ExtensionClinicDashboardResponseSchema, wire);
  if (!parsed.success) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }

  return Response.json(parsed.output satisfies ExtensionClinicDashboardResponse);
}
