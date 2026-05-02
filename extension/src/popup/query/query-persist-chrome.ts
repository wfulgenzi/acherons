import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type {
  AsyncStorage,
  PersistedClient,
  Persister,
} from "@tanstack/query-persist-client-core";

/** Single JSON blob in `chrome.storage.local` (quota ~5 MB). */
export const EXTENSION_QUERY_PERSIST_STORAGE_KEY =
  "acherons_tanstack_query_v1" as const;

/**
 * Current session partition for persisted snapshots — updated from token storage
 * so saves stay aligned with `clientId` / `expiresAt` without remounting the tree.
 */
export const queryPersistBusterRef: { current: string } = { current: "anon" };

export function setQueryPersistBuster(buster: string): void {
  queryPersistBusterRef.current = buster;
}

export function queryCacheBusterFromTokens(t: Record<string, unknown>): string {
  const access =
    typeof t.accessToken === "string" && t.accessToken.length > 0
      ? t.accessToken
      : null;
  if (!access) {
    return "anon";
  }
  const clientId = typeof t.clientId === "string" ? t.clientId : "";
  const exp = t.expiresAt;
  const expiresAt = typeof exp === "number" ? exp : 0;
  return `${clientId}:${expiresAt}`;
}

const chromeLocalAsyncStorage: AsyncStorage<string> = {
  getItem: (key) =>
    new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        void chrome.runtime.lastError;
        const v = result[key];
        resolve(typeof v === "string" ? v : null);
      });
    }),
  setItem: (key, value) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        void chrome.runtime.lastError;
        resolve();
      });
    }),
  removeItem: (key) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.remove([key], () => {
        void chrome.runtime.lastError;
        resolve();
      });
    }),
};

const innerChromePersister = createAsyncStoragePersister({
  storage: chromeLocalAsyncStorage,
  key: EXTENSION_QUERY_PERSIST_STORAGE_KEY,
  throttleTime: 1000,
});

/**
 * Ensures each persisted blob carries {@link queryPersistBusterRef} at save time,
 * even though TanStack's subscribe keeps an older `buster` in closure.
 */
function wrapPersisterWithLiveBuster(inner: Persister): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      await inner.persistClient({
        ...client,
        buster: queryPersistBusterRef.current,
      });
    },
    restoreClient: () => inner.restoreClient(),
    removeClient: () => inner.removeClient(),
  };
}

export const extensionQueryPersister: Persister =
  wrapPersisterWithLiveBuster(innerChromePersister);

export async function removePersistedQueryCache(): Promise<void> {
  await extensionQueryPersister.removeClient();
}
