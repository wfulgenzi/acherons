"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useOrg } from "@/lib/org-context";
import {
  applyReadToAllUnread,
  applyReadToItem,
  mergeNotificationRows,
  mergeWithServerList,
  postMarkAllNotificationsRead,
  postMarkNotificationRead,
  realtimePayloadToItem,
  type NotificationListItem,
} from "@/lib/notifications";
import { useNotificationsRealtime } from "@/lib/notifications/use-notifications-realtime";

type Ctx = {
  items: NotificationListItem[];
  /** Rows with `readAt === null` (not yet read for the org). */
  unreadCount: number;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<Ctx | null>(null);

/**
 * In-app notifications: `initialItems` from the server (layout), merged with
 * Realtime `INSERT`/`UPDATE` and mark-read. Supabase token from `/api/realtime-token`.
 */
export function NotificationsProvider({
  initialItems,
  children,
}: {
  initialItems: NotificationListItem[];
  children: React.ReactNode;
}) {
  const { orgId } = useOrg();
  const [items, setItems] = useState<NotificationListItem[]>(initialItems);

  useEffect(() => {
    // Merging server refresh with in-memory Realtime + client read updates.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sync from RSC props
    setItems((prev) => mergeWithServerList(initialItems, prev));
  }, [initialItems]);

  const onInsert = useCallback((raw: Record<string, unknown>) => {
    setItems((prev) =>
      mergeNotificationRows(prev, realtimePayloadToItem(raw)),
    );
  }, []);

  const onUpdate = useCallback((raw: Record<string, unknown>) => {
    setItems((prev) =>
      mergeNotificationRows(prev, realtimePayloadToItem(raw)),
    );
  }, []);

  useNotificationsRealtime(orgId, { onInsert, onUpdate });

  const markOneRead = useCallback(async (id: string) => {
    const readAt = await postMarkNotificationRead(id);
    if (readAt) {
      setItems((prev) => applyReadToItem(prev, id, readAt));
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const ok = await postMarkAllNotificationsRead();
    if (ok) {
      const readAt = new Date().toISOString();
      setItems((prev) => applyReadToAllUnread(prev, readAt));
    }
  }, []);

  const unreadCount = useMemo(
    () => items.filter((n) => n.readAt == null).length,
    [items],
  );

  const value = useMemo<Ctx>(
    () => ({ items, unreadCount, markOneRead, markAllRead }),
    [items, unreadCount, markOneRead, markAllRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): Ctx {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
