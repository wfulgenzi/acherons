import { APP_BASE } from "./config";

/** Open the webapp in a new tab (optional path, must start with `/`). */
export function openAppTab(path: string = "/"): void {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${APP_BASE}${normalized}`;
  chrome.tabs.create({ url });
}
