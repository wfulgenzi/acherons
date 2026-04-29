import "server-only";

import webpush from "web-push";

let configured = false;

/** Idempotent: configures `web-push` VAPID signing from env. */
export function ensureWebPushVapidConfigured(): boolean {
  if (configured) {
    return true;
  }
  const pub = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();
  if (!pub || !priv || !subject) {
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}
