import { createBrowserClient } from "@supabase/ssr";
import { getRealtimeAccessToken } from "./get-realtime-access-token";

/**
 * Browser Supabase client for the (app) area: Realtime/PostgREST use a custom JWT
 * minted by the server (`/api/realtime-token`) with `org_id` for RLS. This uses
 * the official `accessToken` option so the same token is used for REST and Realtime.
 *
 * The `auth` namespace is disabled on this client (see supabase-js docs for
 * `accessToken`). Use Better Auth for sign-in; use this only for data/realtime.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: true,
      accessToken: getRealtimeAccessToken,
    },
  );
}
