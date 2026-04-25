import type { NotificationListItem } from "./notification-list";

/** Map a Supabase Realtime row payload to our list item shape. */
export function realtimePayloadToItem(
  raw: Record<string, unknown>,
): NotificationListItem {
  const readRaw = raw.read_at ?? raw.readAt;
  const createdRaw = raw.created_at ?? raw.createdAt;
  return {
    id: String(raw.id),
    type: String(raw.type),
    context: (raw.context as Record<string, unknown>) ?? {},
    readAt: readRaw == null ? null : String(readRaw),
    createdAt: String(createdRaw ?? ""),
  };
}
