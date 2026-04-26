import "server-only";

/**
 * `chrome.identity.getRedirectURL()` and `launchWebAuthFlow` complete on
 * `https://<extension-id>.chromiumapp.org/...`. We only allow redirects to
 * that host pattern to avoid open-redirect issues.
 */
export function isChromiumAppRedirectUrl(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.protocol !== "https:") {
      return false;
    }
    const h = u.hostname;
    if (h === "chromiumapp.org" || !h.endsWith(".chromiumapp.org")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
