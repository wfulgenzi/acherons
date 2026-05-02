import { APP_BASE } from "./config";
import {
  MESSAGE_WEB_PUSH_REGISTER,
  sendExtensionMessage,
  type ExtensionWebPushRegisterResponse,
} from "./messages";

/**
 * Runs in the **popup** (or another visible extension page) so
 * `Notification.requestPermission()` has a user gesture.
 */
export async function registerExtensionWebPushFromUi(
  baseUrl: string = APP_BASE,
): Promise<ExtensionWebPushRegisterResponse> {
  let perm: NotificationPermission;
  try {
    perm = await Notification.requestPermission();
  } catch (e: unknown) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  if (perm !== "granted") {
    return {
      ok: false,
      error: `Notification permission not granted (${perm}).`,
    };
  }
  return sendExtensionMessage({
    type: MESSAGE_WEB_PUSH_REGISTER,
    baseUrl,
  });
}
