/**
 * Serializable notification row for RSC → client and Realtime merge.
 */
export type NotificationListItem = {
  id: string;
  type: string;
  context: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

const MAX_IN_MEMORY = 30;

export function mergeNotificationRows(
  previous: NotificationListItem[],
  incoming: NotificationListItem,
): NotificationListItem[] {
  const map = new Map<string, NotificationListItem>();
  for (const row of previous) {
    map.set(row.id, row);
  }
  map.set(incoming.id, incoming);
  return [...map.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_IN_MEMORY);
}

export function mergeWithServerList(
  server: NotificationListItem[],
  client: NotificationListItem[],
): NotificationListItem[] {
  const map = new Map<string, NotificationListItem>();
  for (const row of client) {
    map.set(row.id, row);
  }
  for (const row of server) {
    map.set(row.id, row);
  }
  return [...map.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_IN_MEMORY);
}

export function applyReadToItem(
  items: NotificationListItem[],
  id: string,
  readAt: string,
): NotificationListItem[] {
  return items.map((n) => (n.id === id ? { ...n, readAt } : n));
}

export function applyReadToAllUnread(
  items: NotificationListItem[],
  readAt: string,
): NotificationListItem[] {
  return items.map((n) => (n.readAt == null ? { ...n, readAt } : n));
}
