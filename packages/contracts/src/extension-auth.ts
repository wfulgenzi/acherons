/**
 * Extension OAuth-style flows (`/api/extension/*`).
 */
import * as v from "valibot";

export const ExtensionExchangeBodySchema = v.object({
  code: v.pipe(v.string(), v.minLength(1, "code is required")),
});

export const ExtensionRefreshBodySchema = v.object({
  refreshToken: v.pipe(
    v.string(),
    v.minLength(1, "refreshToken is required"),
  ),
});

/** POST `/api/extension/exchange` */
export type ExtensionExchangeRequest = v.InferOutput<
  typeof ExtensionExchangeBodySchema
>;

/** POST `/api/extension/exchange` & `/api/extension/refresh` success body */
export type ExtensionTokenResponse = {
  accessToken: string;
  refreshToken: string;
  clientId: string;
  expiresAt: number;
};

/** POST `/api/extension/refresh` */
export type ExtensionRefreshRequest = v.InferOutput<
  typeof ExtensionRefreshBodySchema
>;

/** POST `/api/extension/handoff` */
export type ExtensionHandoffResponse = {
  code: string;
  expiresIn: number;
};

/** Shared extension auth error envelope */
export type ExtensionAuthErrorResponse = {
  error: string;
  code?: string;
};
