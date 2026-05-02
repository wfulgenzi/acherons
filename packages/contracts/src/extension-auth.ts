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
export const ExtensionTokenResponseSchema = v.object({
  accessToken: v.string(),
  refreshToken: v.string(),
  clientId: v.string(),
  expiresAt: v.number(),
});

export type ExtensionTokenResponse = v.InferOutput<
  typeof ExtensionTokenResponseSchema
>;

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

/** Organisation membership as returned to the extension (mirrors app `MembershipContext` wire shape). */
export const ExtensionMembershipWireSchema = v.object({
  orgId: v.string(),
  orgName: v.string(),
  orgType: v.picklist(["dispatch", "clinic"]),
  role: v.picklist(["member", "admin"]),
});

export type ExtensionMembershipWire = v.InferOutput<
  typeof ExtensionMembershipWireSchema
>;

/**
 * GET `/api/extension/me`
 * Bearer extension access JWT only (no session cookie).
 * Org-level role (`membership.role`) is the org membership admin flag, not global platform admin.
 */
export const ExtensionMeResponseSchema = v.object({
  membership: v.nullable(ExtensionMembershipWireSchema),
});

export type ExtensionMeResponse = v.InferOutput<
  typeof ExtensionMeResponseSchema
>;
