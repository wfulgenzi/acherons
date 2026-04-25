import type { PageHeaderValue } from "@/lib/page-header-context";

/**
 * Shown when no SetPageHeader is mounted (e.g. very briefly on navigation).
 * Prefer setting headers explicitly per page; these are a safety net.
 */
export function getFallbackPageHeader(
  pathname: string,
): PageHeaderValue | null {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p === "/dashboard") {
    return { title: "Dashboard" };
  }
  if (p === "/requests/new") {
    return { title: "New request" };
  }
  if (p === "/bookings") {
    return { title: "Bookings" };
  }
  if (p === "/requests") {
    return { title: "Requests" };
  }
  if (p === "/proposals") {
    return { title: "Proposals" };
  }
  const m = p.match(/^\/requests\/[^/]+$/);
  if (m) {
    return { title: "Request" };
  }
  if (p.match(/^\/requests\/[^/]+\/edit$/)) {
    return { title: "Edit request" };
  }
  return null;
}
