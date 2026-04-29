/** POST `/api/notifications/read-all` */
export type NotificationsReadAllResponse = {
  ok: true;
  updated: number;
};

/** POST `/api/notifications/:id/read` */
export type NotificationReadResponse = {
  ok: true;
  readAt: string | null;
};
