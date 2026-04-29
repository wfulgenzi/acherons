import * as v from "valibot";

/** `PushSubscription#toJSON().keys` — URL-safe base64 strings. */
export type WebPushSubscriptionKeys = {
  p256dh: string;
  auth: string;
};

const KeysSchema = v.object({
  p256dh: v.pipe(v.string(), v.minLength(1)),
  auth: v.pipe(v.string(), v.minLength(1)),
});

/** POST `/api/extension/push-subscription` */
export const ExtensionPushSubscriptionBodySchema = v.object({
  endpoint: v.pipe(v.string(), v.minLength(1)),
  keys: KeysSchema,
});

export type ExtensionPushSubscriptionRequest = v.InferOutput<
  typeof ExtensionPushSubscriptionBodySchema
>;

/** POST `/api/extension/push-subscription` success */
export type ExtensionPushSubscriptionResponse = {
  ok: true;
  id: string;
};

/** GET `/api/extension/push-vapid` success */
export type WebPushVapidPublicResponse = {
  publicKey: string;
  subject: string;
};
