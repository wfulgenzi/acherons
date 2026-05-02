import {
  type ExtensionMeResponse,
  ExtensionMeResponseSchema,
} from "@acherons/contracts";
import * as v from "valibot";

/** Single storage entry for `GET /api/extension/me` (API2). */
export const EXTENSION_ME_CACHE_KEY = "extensionMeCacheV1";

/** How long a cached profile is considered fresh (popup opens avoid hitting `/me` every time). */
export const EXTENSION_ME_CACHE_TTL_MS = 5 * 60 * 1000;

type MeCacheRecordV1 = {
  v: 1;
  /** Same install line as `chrome.storage.local.clientId` — invalidates cache on reconnect/revoke. */
  clientId: string;
  fetchedAt: number;
  data: ExtensionMeResponse;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/**
 * Returns cached membership payload if TTL valid and `clientId` matches.
 */
export async function readValidExtensionMeCache(
  clientId: string,
): Promise<ExtensionMeResponse | null> {
  if (!clientId) {
    return null;
  }
  const raw = await chrome.storage.local.get(EXTENSION_ME_CACHE_KEY);
  const entry = raw[EXTENSION_ME_CACHE_KEY];
  if (!isRecord(entry)) {
    return null;
  }
  if (entry.v !== 1) {
    return null;
  }
  if (entry.clientId !== clientId) {
    return null;
  }
  if (typeof entry.fetchedAt !== "number") {
    return null;
  }
  if (Date.now() - entry.fetchedAt > EXTENSION_ME_CACHE_TTL_MS) {
    return null;
  }
  const parsed = v.safeParse(ExtensionMeResponseSchema, entry.data);
  if (!parsed.success) {
    return null;
  }
  return parsed.output;
}

export async function writeExtensionMeCache(
  clientId: string,
  data: ExtensionMeResponse,
): Promise<void> {
  const record: MeCacheRecordV1 = {
    v: 1,
    clientId,
    fetchedAt: Date.now(),
    data,
  };
  await chrome.storage.local.set({ [EXTENSION_ME_CACHE_KEY]: record });
}

export async function clearExtensionMeCache(): Promise<void> {
  await chrome.storage.local.remove(EXTENSION_ME_CACHE_KEY);
}
