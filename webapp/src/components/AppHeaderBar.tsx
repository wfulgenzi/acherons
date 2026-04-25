"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon } from "@/components/BellIcon";
import { getNotificationPath, labelForNotificationType } from "@/lib/notifications";
import { useNotifications } from "@/providers";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function AppHeaderBar() {
  const { items, unreadCount, markOneRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const hasUnread = unreadCount > 0;

  const onMarkAllRead = useCallback(async () => {
    if (markingAll || unreadCount === 0) {
      return;
    }
    setMarkingAll(true);
    try {
      await markAllRead();
    } finally {
      setMarkingAll(false);
    }
  }, [markAllRead, markingAll, unreadCount]);

  return (
    <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-brand-200 bg-brand-50/95 backdrop-blur-sm flex items-center justify-end gap-2 px-6">
      <div className="relative" ref={wrapRef}>
        <button
          type="button"
          onClick={toggle}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-200 bg-brand-100 text-brand-600 transition-colors hover:bg-brand-vivid/10 hover:text-brand-vivid"
          title="Notifications"
          aria-label="Notifications"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-haspopup="true"
        >
          <BellIcon />
          {hasUnread && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-50 bg-amber-500"
              title={`${unreadCount} unread`}
            />
          )}
        </button>

        {open && (
          <div
            id={panelId}
            className="absolute right-0 top-11 z-40 w-[min(20rem,calc(100vw-1.5rem))] max-h-80 overflow-hidden rounded-2xl border border-brand-200 bg-white text-left shadow-lg"
            role="menu"
          >
            <div className="flex items-center justify-between gap-2 border-b border-brand-100 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                Notifications
              </span>
              {hasUnread && (
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-0.5 text-xs font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={markingAll}
                  onClick={onMarkAllRead}
                  aria-label="Mark all as read"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <ul className="max-h-64 overflow-y-auto py-1">
              {items.length === 0 ? (
                <li
                  className="px-3 py-4 text-sm text-gray-500"
                  role="presentation"
                >
                  No notifications yet.
                </li>
              ) : (
                items.map((n) => {
                  const path = getNotificationPath(n.type, n.context);
                  const unread = n.readAt == null;
                  return (
                    <li key={n.id} role="none">
                      <Link
                        href={path}
                        onClick={() => {
                          void markOneRead(n.id);
                          setOpen(false);
                        }}
                        role="menuitem"
                        className={`block px-3 py-2.5 text-sm transition-colors hover:bg-brand-50 ${
                          unread
                            ? "font-semibold text-brand-900"
                            : "text-gray-600"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              unread ? "bg-amber-500" : "invisible"
                            }`}
                            aria-hidden
                            title={unread ? "New" : undefined}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="leading-tight text-brand-800">
                              {labelForNotificationType(n.type)}
                            </p>
                            <p className="mt-0.5 text-xs font-normal text-gray-400">
                              {formatTime(n.createdAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
