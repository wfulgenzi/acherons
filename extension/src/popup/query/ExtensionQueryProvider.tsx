import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  QueryClientProvider,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ClinicUnauthorizedError } from "@/shared/api/clinic-errors";
import {
  clearExtensionSessionInStorage,
  getStorageTokens,
} from "@/shared/session";
import { createExtensionQueryClient } from "./create-extension-query-client";
import {
  queryCacheBusterFromTokens,
  removePersistedQueryCache,
  setQueryPersistBuster,
  extensionQueryPersister,
} from "./query-persist-chrome";

let clearingClinic401 = false;

async function clearSessionAfterClinic401(queryClient: ReturnType<
  typeof createExtensionQueryClient
>): Promise<void> {
  if (clearingClinic401) {
    return;
  }
  clearingClinic401 = true;
  try {
    await clearExtensionSessionInStorage();
    await removePersistedQueryCache();
    queryClient.clear();
  } finally {
    clearingClinic401 = false;
  }
}

function ExtensionQueryEffects({
  client,
}: {
  client: ReturnType<typeof createExtensionQueryClient>;
}) {
  useEffect(() => {
    return client.getQueryCache().subscribe((event) => {
      if (event.type !== "updated") {
        return;
      }
      const err = event.query.state.error;
      if (!(err instanceof ClinicUnauthorizedError)) {
        return;
      }
      if (event.query.state.status !== "error") {
        return;
      }
      void clearSessionAfterClinic401(client);
    });
  }, [client]);

  return null;
}

/**
 * One client per popup mount — survives StrictMode via lazy `useState` init.
 * Persists **`clinic`** queries to **`chrome.storage.local`** (see **query-persist-chrome**).
 */
export function ExtensionQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createExtensionQueryClient);
  const [buster, setBuster] = useState<string | null>(null);

  useEffect(() => {
    function sync(t: Record<string, unknown>) {
      const b = queryCacheBusterFromTokens(t);
      setBuster(b);
      setQueryPersistBuster(b);
    }

    void getStorageTokens().then(sync);

    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local") {
        return;
      }
      if (
        !(
          "accessToken" in changes ||
          "clientId" in changes ||
          "expiresAt" in changes
        )
      ) {
        return;
      }
      void getStorageTokens().then(sync);
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, []);

  if (buster === null) {
    return (
      <QueryClientProvider client={client}>
        <ExtensionQueryEffects client={client} />
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{
        persister: extensionQueryPersister,
        maxAge: 86_400_000,
        buster,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            if (!defaultShouldDehydrateQuery(query)) {
              return false;
            }
            const k = query.queryKey;
            if (!Array.isArray(k)) {
              return false;
            }
            if (k[0] === "clinic") {
              return true;
            }
            /** Gate (`/me` + session): skip placeholder key when logged out. */
            if (
              k[0] === "extension" &&
              k[1] === "gate" &&
              k[2] !== "__no_session__"
            ) {
              return true;
            }
            return false;
          },
        },
      }}
    >
      <ExtensionQueryEffects client={client} />
      {children}
    </PersistQueryClientProvider>
  );
}
