import "server-only";

/**
 * @returns Public VAPID key (URL-safe base64) and `subject` (`mailto:` or `https:`) for
 * `PushManager#subscribe` / `web-push` VAPID details. Private key is never read here.
 */
export function getWebPushVapidPublicConfig():
  | { ok: true; publicKey: string; subject: string }
  | { ok: false; reason: "missing_env" } {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (!publicKey || !subject) {
    return { ok: false, reason: "missing_env" };
  }
  return { ok: true, publicKey, subject };
}
