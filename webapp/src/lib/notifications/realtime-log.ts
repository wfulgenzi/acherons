// See useNotificationsRealtime: NEXT_PUBLIC_DEBUG_REALTIME
const envDebug = process.env.NEXT_PUBLIC_DEBUG_REALTIME;
const debugRealtime =
  envDebug === "1" ||
  (process.env.NODE_ENV === "development" && envDebug !== "0");

export function logNotificationsRealtime(...args: unknown[]) {
  if (debugRealtime) {
    console.log("[ach:realtime]", ...args);
  }
}
