const LABELS: Record<string, string> = {
  "proposal.declined": "Proposal declined",
  "proposal.created": "New proposal for your request",
  "request.created": "New request received",
  "request.cancelled": "Request cancelled",
  "booking.created": "Booking confirmed",
  "booking.cancelled": "Booking cancelled",
};

export function labelForNotificationType(type: string): string {
  return LABELS[type] ?? type;
}
