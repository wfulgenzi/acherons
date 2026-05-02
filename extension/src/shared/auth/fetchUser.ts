import {
  type ExtensionMeResponse,
  ExtensionMeResponseSchema,
} from "@acherons/contracts";
import * as v from "valibot";
import { APP_BASE } from "../config";
import {
  clearExtensionMeCache,
  readValidExtensionMeCache,
  writeExtensionMeCache,
} from "./cacheUserInfo";

export type FetchExtensionMeOk = { ok: true; data: ExtensionMeResponse };

export type FetchExtensionMeErr =
  | { ok: false; reason: "http"; status: number }
  | { ok: false; reason: "parse" };

/**
 * Current org membership for gate UX (`GET /api/extension/me`).
 * Validates JSON with `@acherons/contracts` (`ExtensionMeResponseSchema`).
 */
export async function fetchExtensionMe(
  accessToken: string,
): Promise<FetchExtensionMeOk | FetchExtensionMeErr> {
  let res: Response;
  try {
    res = await fetch(`${APP_BASE}/api/extension/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    return { ok: false, reason: "http", status: 0 };
  }

  if (!res.ok) {
    return { ok: false, reason: "http", status: res.status };
  }

  const json: unknown = await res.json();
  const parsed = v.safeParse(ExtensionMeResponseSchema, json);
  if (!parsed.success) {
    return { ok: false, reason: "parse" };
  }

  return { ok: true, data: parsed.output };
}

export type FetchExtensionMeWithCacheOptions = {
  /** Skip cache and always call the network (e.g. dev tools “Ping”). */
  forceRefresh?: boolean;
};

/**
 * Uses **`chrome.storage.local`** TTL cache keyed by **`clientId`** (API2).
 * Clears cache on **401** from `/me`. Pair with **`clearExtensionMeCache`** on logout.
 */
export async function fetchExtensionMeWithCache(
  accessToken: string,
  clientId: string,
  options: FetchExtensionMeWithCacheOptions = {},
): Promise<FetchExtensionMeOk | FetchExtensionMeErr> {
  if (!options.forceRefresh && clientId) {
    const cached = await readValidExtensionMeCache(clientId);
    if (cached !== null) {
      return { ok: true, data: cached };
    }
  }

  const result = await fetchExtensionMe(accessToken);
  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) {
      await clearExtensionMeCache();
    }
    return result;
  }

  if (clientId) {
    await writeExtensionMeCache(clientId, result.data);
  }

  return result;
}
