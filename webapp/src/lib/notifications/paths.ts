import { isNotificationType, parseNotificationContext, type NotificationType } from "./contract";

/**
 * Where to send the user for a notification.
 *
 * **Store IDs in `context` only** (see `contract.ts`); do not persist full URLs in the
 * database — domains, locales, and routes change. Build links at read time.
 *
 * - **In the app (bell, list):** call `getNotificationPath` on the client (or when
 *   rendering a server component) with the same payload you stored.
 * - **Emails / external systems:** `getNotificationUrl(relativePath, process.env.BETTER_AUTH_URL)`
 *   (or your canonical app URL) on the server when you send the message, so the link
 *   is absolute when needed.
 */
export function getNotificationPath(
  type: string,
  context: unknown,
): `/${string}` {
  if (!isNotificationType(type)) {
    return "/dashboard";
  }
  const c = parseNotificationContext(type, context);
  // Primary surface for all current kinds is the request (proposals + booking context).
  return `/requests/${c.requestId}`;
}

/**
 * When `baseUrl` is set (e.g. `https://app.example.com`, no trailing slash), returns
 * a stable absolute URL for use in email etc. When omitted, returns a path-only
 * string starting with `/` (same as `getNotificationPath` for valid types).
 */
export function getNotificationUrl(
  type: string,
  context: unknown,
  baseUrl: string,
): string {
  const path = getNotificationPath(type, context);
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

/**
 * Shorthand when you already parsed `type` and `context`.
 */
export function getNotificationPathForPayload(payload: {
  type: NotificationType;
  context: { requestId: string };
}): `/${string}` {
  return getNotificationPath(payload.type, payload.context);
}
