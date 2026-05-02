import { APP_BASE } from "@/shared/config";


/** VAPID `applicationServerKey` decoding for `PushManager#subscribe`. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function appOriginForNotifications(): string {
  return APP_BASE;
}

/** PNG paths bundled at extension root (see `manifest.json` / `public/`). */
export function extensionStaticAssetUrl(fileName: string): string {
  return chrome.runtime.getURL(fileName);
}

/**
 * Icons for `showNotification`. Desktop Chrome mainly shows **icon**; **badge**
 * is honored more on Android — still safe to set for consistency.
 */
export function notificationIconOptions(): Pick<
  NotificationOptions,
  "icon" | "badge"
> {
  const icon = extensionStaticAssetUrl("favicon.png");
  return { icon, badge: icon };
}

async function countTabsOnAppOrigin(origin: string): Promise<number> {
  const pattern = `${origin}/*`;
  const byPattern = await chrome.tabs.query({ url: pattern });
  if (byPattern.length > 0) {
    return byPattern.length;
  }
  /** Fallback: some Chrome builds match `url` patterns inconsistently. */
  const all = await chrome.tabs.query({});
  const slash = `${origin}/`;
  return all.filter(
    (t) =>
      typeof t.url === "string" &&
      (t.url === origin || t.url.startsWith(slash)),
  ).length;
}

export type EnsureBackgroundTabResult =
  | { ok: true; action: "created" | "skipped"; matchingTabs: number }
  | { ok: false; error: string };

/**
 * Ensures at least one tab exists on the webapp origin (quiet load for push UX).
 * Use **`force: true`** in devtools to always call **`tabs.create`** (simulates first-open).
 */
export async function ensureBackgroundTabForWebapp(options?: {
  force?: boolean;
}): Promise<EnsureBackgroundTabResult> {
  try {
    const base = appOriginForNotifications();
    const origin = base.replace(/\/$/, "");
    const matchingTabs = await countTabsOnAppOrigin(origin);
    if (matchingTabs > 0 && !options?.force) {
      return { ok: true, action: "skipped", matchingTabs };
    }
    await chrome.tabs.create({
      url: `${origin}/dashboard`,
      active: false,
    });
    console.log("[Acherons ext] ensureBackgroundTabForWebapp: created tab", {
      origin,
      force: !!options?.force,
      hadMatching: matchingTabs,
    });
    return {
      ok: true,
      action: "created",
      matchingTabs,
    };
  } catch (e: unknown) {
    const detail = e instanceof Error ? e.message : String(e);
    console.warn("[Acherons ext] ensureBackgroundTabForWebapp", detail);
    return { ok: false, error: detail };
  }
}
