/** GET `/api/realtime-token` success body */
export type RealtimeTokenResponse = {
  token: string;
  expiresAt: number;
};
