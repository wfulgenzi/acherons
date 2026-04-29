import { NextResponse, type NextRequest } from "next/server";
import * as v from "valibot";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { withRLS } from "@/db/rls";
import {
  assertActiveExtensionClientForUser,
  upsertWebPushSubscriptionForClient,
  WebPushClientForbiddenError,
} from "@/lib/web-push/upsert-subscription.server";

export const dynamic = "force-dynamic";

const KeysSchema = v.object({
  p256dh: v.pipe(v.string(), v.minLength(1)),
  auth: v.pipe(v.string(), v.minLength(1)),
});

const BodySchema = v.object({
  endpoint: v.pipe(v.string(), v.minLength(1)),
  keys: KeysSchema,
});

/**
 * Stores or updates a Web Push subscription for the caller’s active extension
 * `clientId` (from the access JWT). Call with
 * `Authorization: Bearer` + extension access token.
 * Body matches `PushSubscription#toJSON()` (endpoint + keys).
 */
export async function POST(request: NextRequest) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }

  const { userId, extensionClientId, source } = apiAuth;
  if (source !== "extension" || !extensionClientId) {
    return NextResponse.json(
      {
        error: "Use an extension access token (Authorization: Bearer).",
      },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(BodySchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: v.flatten(parsed.issues) },
      { status: 400 },
    );
  }
  const { endpoint, keys } = parsed.output;

  try {
    const { id } = await withRLS({ userId }, async (tx) => {
      await assertActiveExtensionClientForUser(tx, {
        clientId: extensionClientId,
      });
      return upsertWebPushSubscriptionForClient(tx, {
        userId,
        clientId: extensionClientId,
        endpoint,
        keys,
      });
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    if (e instanceof WebPushClientForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}
