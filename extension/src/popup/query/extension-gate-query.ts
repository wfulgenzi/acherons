import type { ExtensionMembershipWire } from "@acherons/contracts";
import { fetchExtensionMeWithCache } from "@/shared/auth/fetchUser";
import {
  checkExtensionSession,
  getBearerAccessToken,
  getStorageTokens,
} from "@/shared/session";

export type ExtensionGateData =
  | { kind: "onboarding" }
  | { kind: "dispatcher"; membership: ExtensionMembershipWire }
  | { kind: "clinic"; membership: ExtensionMembershipWire };

/**
 * Full gate resolution: session ping / refresh (via {@link checkExtensionSession}),
 * then **`GET /api/extension/me`** (with API2 storage TTL when `forceMe` is false).
 * Used as TanStack **`queryFn`** so the result can be persisted across popup closes.
 */
export async function fetchExtensionGateQuery(options: {
  forceMe?: boolean;
} = {}): Promise<ExtensionGateData> {
  const session = await checkExtensionSession();

  if (session.state === "no_tokens") {
    throw new Error("No tokens.");
  }

  if (session.state !== "ok") {
    throw new Error(session.detail.slice(0, 240));
  }

  const bearer = await getBearerAccessToken();
  if (!bearer.ok) {
    throw new Error(bearer.detail);
  }

  const st = await getStorageTokens();
  const clientId = typeof st.clientId === "string" ? st.clientId : "";

  const me = await fetchExtensionMeWithCache(bearer.token, clientId, {
    forceRefresh: !!options.forceMe,
  });
  if (!me.ok) {
    if (me.reason === "http" && me.status === 401) {
      throw new Error("Session expired. Sign in again.");
    }
    if (me.reason === "http") {
      throw new Error(
        me.status === 0
          ? "Could not reach the app. Is it running?"
          : `Could not load profile (${me.status}).`,
      );
    }
    throw new Error("Unexpected response from the server.");
  }

  const m = me.data.membership;
  if (m === null) {
    return { kind: "onboarding" };
  }
  if (m.orgType === "dispatch") {
    return { kind: "dispatcher", membership: m };
  }
  return { kind: "clinic", membership: m };
}
