import { NextResponse } from "next/server";
import { getWebPushVapidPublicConfig } from "@/lib/web-push/vapid-public.server";

export const dynamic = "force-dynamic";

/**
 * Returns public VAPID material for extension / web clients (`PushManager#subscribe`).
 * No authentication — public key + subject are not secret (same as serving JWKS).
 *
 * Client: decode `publicKey` with `Uint8Array.from(atob(urlBase64ToRaw(publicKey)), ...)`
 * or the usual `urlBase64ToUint8Array` helper matching how `web-push` formats the key.
 */
export async function GET() {
  const cfg = getWebPushVapidPublicConfig();
  if (!cfg.ok) {
    return NextResponse.json(
      { error: "Web Push VAPID is not configured on the server." },
      { status: 503 },
    );
  }
  return NextResponse.json({
    publicKey: cfg.publicKey,
    subject: cfg.subject,
  });
}
