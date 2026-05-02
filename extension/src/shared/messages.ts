/**
 * Typed `chrome.runtime.sendMessage` payloads between UI contexts and the
 * background service worker (and background ↔ offscreen).
 */

import { appendExtensionDebugLog } from "./extension-debug-log";

/** --- Popup / UI → background --- */

export const MESSAGE_EXTENSION_LAUNCH_AUTH = "EXTENSION_LAUNCH_AUTH" as const;

export const MESSAGE_WEB_PUSH_REGISTER = "WEB_PUSH_REGISTER" as const;

export type ExtensionLaunchAuthRequest = {
  type: typeof MESSAGE_EXTENSION_LAUNCH_AUTH;
  state: string;
};

export type ExtensionWebPushRegisterRequest = {
  type: typeof MESSAGE_WEB_PUSH_REGISTER;
  /** Defaults to app base URL in the background when omitted. */
  baseUrl?: string;
};

/** All requests handled by `background/index.ts` `onMessage`. */
export type ExtensionToBackgroundRequest =
  | ExtensionLaunchAuthRequest
  | ExtensionWebPushRegisterRequest;

/** --- Responses (background → caller) --- */

export type ExtensionLaunchAuthResponse =
  | { ok: true }
  | { ok: false; error: string };

export type ExtensionWebPushRegisterResponse =
  | { ok: true; id: string }
  | { ok: false; error?: string };

export type ExtensionBackgroundResponseFor<M extends ExtensionToBackgroundRequest> =
  M extends ExtensionLaunchAuthRequest
    ? ExtensionLaunchAuthResponse
    : M extends ExtensionWebPushRegisterRequest
      ? ExtensionWebPushRegisterResponse
      : never;

/** --- Background → offscreen document --- */

export const MESSAGE_OFFSCREEN_BEEP = "OFFSCREEN_BEEP" as const;

export type BackgroundToOffscreenRequest = {
  type: typeof MESSAGE_OFFSCREEN_BEEP;
};

export type OffscreenBeepResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Chrome types `onMessage`’s `sendResponse` as `(response?: unknown) => void`.
 * Use {@link sendRuntimeReply} at each branch so the payload matches our contracts.
 */
export type UntypedRuntimeSendResponse = (response?: unknown) => void;

export function sendRuntimeReply<R>(
  sendResponse: UntypedRuntimeSendResponse,
  payload: R,
): void {
  sendResponse(payload);
}

/**
 * Typed wrapper around `chrome.runtime.sendMessage` for UI → background calls.
 */
export function sendExtensionMessage<M extends ExtensionToBackgroundRequest>(
  message: M,
): Promise<ExtensionBackgroundResponseFor<M>> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      message,
      (response: ExtensionBackgroundResponseFor<M>) => {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
          void appendExtensionDebugLog(
            "runtime",
            `sendMessage lastError: ${lastErr.message} type=${String((message as { type?: string }).type)}`,
          );
          reject(new Error(lastErr.message));
          return;
        }
        resolve(response);
      },
    );
  });
}
