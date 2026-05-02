/**
 * TanStack Query cache partition for workspace GETs: changes when this install’s
 * tokens rotate (`expiresAt`) or client identity changes — not on every tab switch.
 */
export type SessionQueryScope = {
  clientId: string;
  /** Unix seconds from `chrome.storage` — bumps when access token is refreshed. */
  expiresAt: number;
};

export function sessionQueryKeyPart(scope: SessionQueryScope): [
  string,
  string,
  number,
] {
  return [scope.clientId, "exp", scope.expiresAt];
}
