/** Ring buffer in `chrome.storage.local` so auth/debug traces survive popup closure. */

export const EXTENSION_DEBUG_LOG_KEY = "extensionDebugLogV1";
const MAX_LINES = 120;

function iso(): string {
  return new Date().toISOString();
}

export async function appendExtensionDebugLog(
  scope: string,
  message: string,
): Promise<void> {
  const line = `${iso()} [${scope}] ${message}`;
  try {
    const raw = await chrome.storage.local.get(EXTENSION_DEBUG_LOG_KEY);
    const prev = raw[EXTENSION_DEBUG_LOG_KEY];
    const arr = Array.isArray(prev)
      ? (prev as string[])
      : typeof prev === "string"
        ? [prev]
        : [];
    const next = [...arr, line].slice(-MAX_LINES);
    await chrome.storage.local.set({ [EXTENSION_DEBUG_LOG_KEY]: next });
  } catch {
    /* ignore storage failures */
  }
}

export async function readExtensionDebugLog(): Promise<string[]> {
  const raw = await chrome.storage.local.get(EXTENSION_DEBUG_LOG_KEY);
  const v = raw[EXTENSION_DEBUG_LOG_KEY];
  if (Array.isArray(v)) {
    return v as string[];
  }
  if (typeof v === "string") {
    return [v];
  }
  return [];
}

export async function clearExtensionDebugLog(): Promise<void> {
  await chrome.storage.local.remove(EXTENSION_DEBUG_LOG_KEY);
}
