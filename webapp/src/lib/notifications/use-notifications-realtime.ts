"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Handlers = {
  onInsert: (row: Record<string, unknown>) => void;
  onUpdate: (row: Record<string, unknown>) => void;
};

/**
 * Subscribes to `notifications` INSERT/UPDATE for `orgId` (Supabase Realtime).
 */
export function useNotificationsRealtime(orgId: string, handlers: Handlers) {
  const { onInsert, onUpdate } = handlers;

  useEffect(() => {
    const supabase = createClient();
    const filter = `org_id=eq.${orgId}`;

    const channel = supabase
      .channel(`notifications:${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter,
        },
        (payload) => {
          if (payload.new) {
            onInsert(payload.new as Record<string, unknown>);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(payload.new as Record<string, unknown>);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, onInsert, onUpdate]);
}
