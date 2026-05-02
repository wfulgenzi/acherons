/**
 * Loaded in an offscreen document created by the service worker so we can play
 * audio on push (Push handlers cannot reliably start AudioContext without offscreen).
 */
import { MESSAGE_OFFSCREEN_BEEP } from "@/shared/messages";
import { playPushBell } from "./play-push-bell";

chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
  if (
    msg &&
    typeof msg === "object" &&
    (msg as { type?: string }).type === MESSAGE_OFFSCREEN_BEEP
  ) {
    try {
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.85;
      master.connect(ctx.destination);
      const stopMs = playPushBell(ctx, master, now);
      setTimeout(() => {
        void ctx.close();
      }, stopMs + 40);
      sendResponse({ ok: true });
    } catch (e: unknown) {
      sendResponse({
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
    return true;
  }
  return false;
});
