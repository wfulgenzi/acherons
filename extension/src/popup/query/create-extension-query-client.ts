import { QueryClient } from "@tanstack/react-query";

/**
 * Popup-only defaults: no real “window focus”; avoid refetch storms on tab nav.
 * Per-query `staleTime` overrides for clinic routes live on `useQuery` calls.
 */
export function createExtensionQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  });
}
