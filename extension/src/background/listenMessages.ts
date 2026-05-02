import { launchExtensionAuthInBackground } from "@/shared/auth/launchAuth";
import { appendExtensionDebugLog } from "@/shared/extension-debug-log";
import { APP_BASE } from "@/shared/config";
import {
  MESSAGE_EXTENSION_LAUNCH_AUTH,
  MESSAGE_WEB_PUSH_REGISTER,
  sendRuntimeReply,
  type ExtensionLaunchAuthRequest,
  type ExtensionLaunchAuthResponse,
  type ExtensionWebPushRegisterResponse,
} from "@/shared/messages";
import { setPushRegisteredTrue } from "@/shared/push-local-state";
import { sw } from "./constants";
import { handleWebPushRegister } from "./webPush";

/** Popup → background RPC (`chrome.runtime.onMessage`). */
export function registerRuntimeMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || typeof msg !== "object") {
      return false;
    }
    if ((msg as { type?: string }).type === MESSAGE_EXTENSION_LAUNCH_AUTH) {
      const state = String((msg as ExtensionLaunchAuthRequest).state ?? "");
      void appendExtensionDebugLog(
        "messages",
        `EXTENSION_LAUNCH_AUTH received stateLen=${state.length}`,
      );
      console.log("[Acherons extension][messages] EXTENSION_LAUNCH_AUTH");
      void launchExtensionAuthInBackground(state)
        .then((result: ExtensionLaunchAuthResponse) => {
          void appendExtensionDebugLog(
            "messages",
            result.ok
              ? "EXTENSION_LAUNCH_AUTH reply ok=true"
              : `EXTENSION_LAUNCH_AUTH reply ok=false error=${result.error.slice(0, 160)}`,
          );
          sendRuntimeReply<ExtensionLaunchAuthResponse>(sendResponse, result);
        })
        .catch((e: unknown) => {
          const err: ExtensionLaunchAuthResponse = {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          };
          void appendExtensionDebugLog(
            "messages",
            `EXTENSION_LAUNCH_AUTH catch ${err.error}`,
          );
          sendRuntimeReply(sendResponse, err);
        });
      return true;
    }
    if ((msg as { type?: string }).type === MESSAGE_WEB_PUSH_REGISTER) {
      const baseUrl = String(
        (msg as { baseUrl?: string }).baseUrl ?? APP_BASE,
      );
      void handleWebPushRegister(sw.registration, baseUrl)
        .then(async (result) => {
          if (result.ok) {
            await setPushRegisteredTrue();
          }
          sendRuntimeReply<ExtensionWebPushRegisterResponse>(
            sendResponse,
            result,
          );
        })
        .catch((e: unknown) => {
          const err: ExtensionWebPushRegisterResponse = {
            ok: false,
            error: e instanceof Error ? e.message : String(e),
          };
          sendRuntimeReply(sendResponse, err);
        });
      return true;
    }
    return false;
  });
}
