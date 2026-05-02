import { playPushBeep } from "./offscreen";
import { sw } from "./constants";
import {
  appOriginForNotifications,
  ensureBackgroundTabForWebapp,
  notificationIconOptions,
} from "./helpers";
import { parsePushPayload } from "./webPush";
import {
  clearExtensionToolbarBadge,
  setExtensionUnreadBadge,
} from "@/shared/extension-toolbar-badge";

/** Incoming push: banner + optional beep + quiet tab on webapp origin. */
export function registerPushListeners(): void {
  sw.addEventListener("push", (event: Event) => {
    const pe = event as PushEvent;
    console.log(
      "[Acherons ext] push: event received",
      pe.data ? "(has payload bytes)" : "(no payload / check-up only)",
    );
    pe.waitUntil(
      parsePushPayload(pe)
        .then(({ title, body }) => {
          setExtensionUnreadBadge();
          const icons = notificationIconOptions();
          return Promise.all([
            (async () => {
              console.log("[Acherons ext] push: showing notification", {
                title,
                bodyPreview: body.length > 80 ? body.slice(0, 80) + "…" : body,
              });
              await sw.registration.showNotification(title, {
                body,
                tag: "acherons-notification",
                renotify: true,
                ...icons,
              } as NotificationOptions);
            })(),
            playPushBeep(),
            ensureBackgroundTabForWebapp().then((r) => {
              if (!r.ok) {
                console.warn(
                  "[Acherons ext] push: quiet tab failed",
                  r.error,
                );
              } else if (r.action === "skipped") {
                console.log(
                  "[Acherons ext] push: quiet tab skipped",
                  r.matchingTabs,
                  "tab(s) already on origin",
                );
              }
            }),
          ]);
        })
        .catch((err: unknown) => {
          console.error(
            "[Acherons ext] push: showNotification or parse failed",
            err,
          );
        }),
    );
  });

  sw.addEventListener("notificationclick", (event: Event) => {
    const ne = event as NotificationEvent;
    ne.notification.close();
    clearExtensionToolbarBadge();
    const base = appOriginForNotifications();
    ne.waitUntil(
      sw.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((windowClients: readonly WindowClient[]) => {
          const prefix = base.replace(/\/$/, "");
          for (const client of windowClients) {
            const url = typeof client.url === "string" ? client.url : "";
            if (url.startsWith(prefix) && "focus" in client) {
              return client.focus();
            }
          }
          if (sw.clients.openWindow) {
            return sw.clients.openWindow(`${prefix}/dashboard`);
          }
        }),
    );
  });
}
