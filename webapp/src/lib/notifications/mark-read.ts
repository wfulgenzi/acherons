/**
 * Mark one notification as read (current org) via the app API.
 * @returns the new `readAt` ISO string, or `null` on failure
 */
export async function postMarkNotificationRead(
  id: string,
): Promise<string | null> {
  const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as { readAt?: string | null };
  return data.readAt ?? null;
}

/**
 * Mark all unread notifications for the org as read.
 * @returns whether the request succeeded
 */
export async function postMarkAllNotificationsRead(): Promise<boolean> {
  const res = await fetch("/api/notifications/read-all", { method: "POST" });
  return res.ok;
}
