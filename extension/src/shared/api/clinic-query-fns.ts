import type {
  ExtensionClinicBookingsResponse,
  ExtensionClinicDashboardResponse,
  ExtensionClinicProposalsResponse,
  ExtensionClinicRequestsResponse,
} from "@acherons/contracts";
import { ClinicUnauthorizedError } from "./clinic-errors";
import { fetchExtensionClinicBookings } from "./bookings";
import { fetchExtensionClinicDashboard } from "./dashboard";
import { fetchExtensionClinicProposals } from "./proposals";
import { fetchExtensionClinicRequests } from "./requests";

type ExtensionGetErr =
  | { ok: false; reason: "http"; status: number }
  | { ok: false; reason: "parse" };

function netErr(status: number, label: string): string {
  return status === 0
    ? "Network error. Is the web app running?"
    : `Could not load ${label} (${status}).`;
}

function unwrapExtensionGet<T>(
  r: { ok: true; data: T } | ExtensionGetErr,
  options: { resourceLabel: string; parseMessage: string },
): T {
  if (r.ok) {
    return r.data;
  }
  if (r.reason === "parse") {
    throw new Error(options.parseMessage);
  }
  if (r.reason === "http" && r.status === 401) {
    throw new ClinicUnauthorizedError();
  }
  throw new Error(netErr(r.status, options.resourceLabel));
}

/** Used as TanStack `queryFn` — throws so `useQuery` surfaces `error`. */
export async function fetchClinicDashboardQuery(
  accessToken: string,
): Promise<ExtensionClinicDashboardResponse> {
  const r = await fetchExtensionClinicDashboard(accessToken);
  return unwrapExtensionGet(r, {
    resourceLabel: "dashboard",
    parseMessage: "Could not read dashboard data.",
  });
}

export async function fetchClinicRequestsQuery(
  accessToken: string,
): Promise<ExtensionClinicRequestsResponse> {
  const r = await fetchExtensionClinicRequests(accessToken);
  return unwrapExtensionGet(r, {
    resourceLabel: "requests",
    parseMessage: "Could not read requests.",
  });
}

export async function fetchClinicProposalsQuery(
  accessToken: string,
): Promise<ExtensionClinicProposalsResponse> {
  const r = await fetchExtensionClinicProposals(accessToken);
  return unwrapExtensionGet(r, {
    resourceLabel: "proposals",
    parseMessage: "Could not read proposals.",
  });
}

export async function fetchClinicBookingsQuery(
  accessToken: string,
): Promise<ExtensionClinicBookingsResponse> {
  const r = await fetchExtensionClinicBookings(accessToken);
  return unwrapExtensionGet(r, {
    resourceLabel: "bookings",
    parseMessage: "Could not read bookings.",
  });
}
