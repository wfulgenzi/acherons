/**
 * Loaded in an offscreen document so we can play audio from the MV3 service worker
 * (Push handlers cannot reliably start AudioContext without offscreen / user gesture).
 */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "OFFSCREEN_BEEP") {
    try {
      playShortBeep();
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false, error: String(e && e.message ? e.message : e) });
    }
    return true;
  }
  return false;
});

function playShortBeep() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.value = 0.06;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  const stopMs = 90;
  setTimeout(() => {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
    ctx.close();
  }, stopMs);
}
