/** Max `consumed` `extension_refresh` rows kept per `client_id` (tombstones for reuse detection). */
export const EXTENSION_REFRESH_TOMBSTONE_CAP = 5;

/** Access JWT `aud` claim; verify requires this. */
export const EXTENSION_JWT_AUDIENCE = "acherons-extension";

/** One-time handoff & refresh token lifetime. */
export const EXTENSION_ACCESS_TTL = "15m" as const;
/** How long a one-time handoff code remains valid (minutes). */
export const EXTENSION_HANDOFF_TTL_MIN = 10;
