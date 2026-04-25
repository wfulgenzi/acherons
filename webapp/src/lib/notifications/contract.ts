import * as v from "valibot";

/**
 * In-app notification kinds. Stored in `notifications.type` and validated in app code.
 * Use dot.case namespacing: `<domain>.<action>`.
 */
export const NOTIFICATION_TYPES = [
  "proposal.declined",
  "proposal.created",
  "request.created",
  "request.cancelled",
  "booking.created",
  "booking.cancelled",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export function isNotificationType(s: string): s is NotificationType {
  return (NOTIFICATION_TYPES as readonly string[]).includes(s);
}

const uuid = v.pipe(v.string(), v.uuid("Expected a UUID"));

/**
 * `context` JSON in `notifications.context` per `type` (store IDs only; no URLs).
 */
const contextRequestOnly = v.object({ requestId: uuid });

const contextProposal = v.object({
  requestId: uuid,
  proposalId: uuid,
});

const contextBooking = v.object({
  requestId: uuid,
  bookingId: uuid,
});

const schemas = {
  "request.created": contextRequestOnly,
  "request.cancelled": contextRequestOnly,
  "proposal.created": contextProposal,
  "proposal.declined": contextProposal,
  "booking.created": contextBooking,
  "booking.cancelled": contextBooking,
} as const;

export type NotificationContext<T extends NotificationType = NotificationType> =
  T extends keyof typeof schemas
    ? v.InferOutput<(typeof schemas)[T]>
    : never;

export type NotificationPayload<T extends NotificationType = NotificationType> = {
  type: T;
  context: NotificationContext<T>;
};

export const notificationTypeSchema = v.picklist(NOTIFICATION_TYPES);

export function parseNotificationContext<T extends NotificationType>(
  type: T,
  context: unknown,
): NotificationContext<T> {
  const schema = schemas[type] as v.GenericSchema;
  return v.parse(schema, context) as NotificationContext<T>;
}

/**
 * After validating `type`, parse `context` from a DB row.
 * @throws v.ValiError if shape does not match `type`
 */
export function parseNotificationRow(row: {
  type: string;
  context: unknown;
}):
  | NotificationPayload
  | { type: string; context: unknown; _parseError: true } {
  if (!isNotificationType(row.type)) {
    return { ...row, _parseError: true as const };
  }
  try {
    return {
      type: row.type,
      context: parseNotificationContext(row.type, row.context),
    };
  } catch {
    return { ...row, _parseError: true as const };
  }
}
