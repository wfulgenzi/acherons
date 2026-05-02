/** Toolbar puzzle-piece badge (separate from system notification artwork). */

export function setExtensionUnreadBadge(): void {
  try {
    chrome.action.setBadgeBackgroundColor({ color: "#c2410c" });
    chrome.action.setBadgeText({ text: "!" });
  } catch {
    /* ignore */
  }
}

export function clearExtensionToolbarBadge(): void {
  try {
    chrome.action.setBadgeText({ text: "" });
  } catch {
    /* ignore */
  }
}
