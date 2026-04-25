"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BellIcon } from "@/components/BellIcon";
import { getNotificationPath, labelForNotificationType } from "@/lib/notifications";
import { getFallbackPageHeader } from "@/lib/route-fallback-page-header";
import { usePageHeader } from "@/lib/page-header-context";
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
  const pathname = usePathname();
  const { header: pageHeader } = usePageHeader();
  const effective = useMemo(() => {
    if (pageHeader) {
      return pageHeader;
    }
    return getFallbackPageHeader(pathname) ?? { title: "" };
  }, [pageHeader, pathname]);
  const { items, unreadCount, markOneRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelOpen = open || panelClosing;

  const startClosePanel = useCallback(() => {
    if (open) {
      setOpen(false);
      setPanelClosing(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open && !panelClosing) {
      return;
    }
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        startClosePanel();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        startClosePanel();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, panelClosing, startClosePanel]);

  const toggle = useCallback(() => {
    if (open) {
      setOpen(false);
      setPanelClosing(true);
    } else {
      setOpen(true);
      setPanelClosing(false);
    }
  }, [open]);
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

  const onPanelAnimationEnd = useCallback(
    (e: React.AnimationEvent<HTMLDivElement>) => {
      if (e.currentTarget !== e.target) {
        return;
      }
      if (e.animationName !== "notif-popover-out") {
        return;
      }
      if (panelClosing) {
        setPanelClosing(false);
      }
    },
    [panelClosing],
  );

  // When exit animation is disabled (e.g. prefers-reduced-motion), onAnimationEnd
  // may not run — ensure the panel can still unmount.
  useEffect(() => {
    if (!panelClosing) {
      return;
    }
    const id = window.setTimeout(() => {
      setPanelClosing(false);
    }, 300);
    return () => clearTimeout(id);
  }, [panelClosing]);

  return (
    <header className="sticky top-0 z-30 min-h-14 shrink-0 border-b border-brand-200 bg-brand-50/95 backdrop-blur-sm flex items-center justify-between gap-3 px-6 py-2">
      <div className="min-w-0 flex-1 pr-2">
        {effective.title ? (
          <>
            <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
              {effective.title}
            </h1>
            {effective.subtitle ? (
              <p className="truncate text-xs text-gray-500 sm:text-sm">
                {effective.subtitle}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      {effective.actions != null && (
        <div className="shrink-0 flex items-center gap-2 max-sm:max-w-[50vw]">
          {effective.actions}
        </div>
      )}
      <div className="relative shrink-0" ref={wrapRef}>
        <button
          type="button"
          onClick={toggle}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-brand-200 bg-brand-100 text-brand-600 transition-colors hover:bg-brand-vivid/10 hover:text-brand-vivid"
          title="Notifications"
          aria-label="Notifications"
          aria-expanded={panelOpen}
          aria-controls={panelOpen ? panelId : undefined}
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

        {panelOpen && (
          <div
            id={panelId}
            onAnimationEnd={onPanelAnimationEnd}
            className={
              "notif-popover absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-1.5rem))] max-h-[min(24rem,70vh)] overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-b from-white to-brand-50 text-left shadow-lg shadow-brand-800/8 ring-1 ring-brand-200/60 " +
              (panelClosing ? "notif-popover--exit" : "notif-popover--enter")
            }
            role="menu"
            aria-label="Notification list"
          >
            <div className="border-b border-brand-200 bg-brand-100 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold tracking-tight text-brand-800">
                  Notifications
                </span>
                {hasUnread && (
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-brand-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-600 shadow-sm transition-all hover:border-brand-300 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={markingAll}
                    onClick={onMarkAllRead}
                    aria-label="Mark all as read"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            <ul className="max-h-64 overflow-y-auto overscroll-contain p-1.5">
              {items.length === 0 ? (
                <li
                  className="rounded-xl px-3 py-6 text-center text-sm text-gray-500"
                  role="presentation"
                >
                  <p className="text-brand-600/80">You&apos;re all caught up</p>
                  <p className="mt-1 text-xs text-gray-400">
                    No notifications yet
                  </p>
                </li>
              ) : (
                items.map((n) => {
                  const path = getNotificationPath(n.type, n.context);
                  const unread = n.readAt == null;
                  return (
                    <li key={n.id} role="none" className="p-0.5">
                      <Link
                        href={path}
                        onClick={() => {
                          void markOneRead(n.id);
                          setOpen(false);
                          setPanelClosing(true);
                        }}
                        role="menuitem"
                        className={
                          "group focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-500 " +
                          "block rounded-xl px-2.5 py-2.5 text-sm transition-all duration-200 ease-out " +
                          (unread
                            ? "bg-brand-100/30 font-semibold text-brand-900 ring-1 ring-amber-400/20 hover:bg-brand-100/70 hover:ring-amber-400/35"
                            : "text-gray-600 ring-1 ring-transparent hover:bg-brand-100/40")
                        }
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className={
                              "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-110 " +
                              (unread
                                ? "bg-amber-500 shadow-sm shadow-amber-500/40"
                                : "invisible")
                            }
                            aria-hidden
                            title={unread ? "New" : undefined}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="leading-tight text-brand-800 group-hover:text-brand-900">
                              {labelForNotificationType(n.type)}
                            </p>
                            <p className="mt-0.5 text-xs font-medium tabular-nums text-brand-500/80">
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
