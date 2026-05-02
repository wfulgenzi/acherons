import {
  MESSAGE_OFFSCREEN_BEEP,
  type BackgroundToOffscreenRequest,
} from "@/shared/messages";

async function ensureOffscreenAudioDoc(): Promise<void> {
  const url = chrome.runtime.getURL("pages/offscreen.html");
  if (chrome.offscreen.hasDocument) {
    if (await chrome.offscreen.hasDocument()) {
      return;
    }
  }
  try {
    await chrome.offscreen.createDocument({
      url,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification:
        "Brief tone when a Web Push arrives so alerts are noticeable if OS banners are off.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already|single|exist/i.test(msg)) {
      throw e;
    }
  }
}

export async function playPushBeep(): Promise<void> {
  try {
    if (!chrome.offscreen?.createDocument) {
      return;
    }
    await ensureOffscreenAudioDoc();
    await new Promise((r) => setTimeout(r, 80));
    chrome.runtime.sendMessage(
      { type: MESSAGE_OFFSCREEN_BEEP } satisfies BackgroundToOffscreenRequest,
      () => {
        void chrome.runtime.lastError;
      },
    );
  } catch (e) {
    console.warn("[Acherons ext] playPushBeep", e);
  }
}
