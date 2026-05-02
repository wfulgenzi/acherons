/**
 * OAuth handoff used by the **background service worker** only.
 * Do not call `chrome.identity.launchWebAuthFlow` from the popup — Chrome closes
 * the popup when the auth window opens, so the callback often never runs.
 */
import { exchangeExtensionCode } from "@/shared/auth/exchangeCode";
import { appendExtensionDebugLog } from "@/shared/extension-debug-log";
import { APP_BASE } from "@/shared/config";

const AUTH_LOG = "auth";

function slog(message: string): void {
  console.log(`[Acherons extension][${AUTH_LOG}]`, message);
}

export type LaunchExtensionAuthResult =
  | { ok: true }
  | { ok: false; error: string };

export async function launchExtensionAuthInBackground(
  state: string,
): Promise<LaunchExtensionAuthResult> {
  await appendExtensionDebugLog(AUTH_LOG, "launchExtensionAuthInBackground start");
  slog("launchExtensionAuthInBackground start");

  if (!state) {
    await appendExtensionDebugLog(AUTH_LOG, "FAIL missing state");
    slog("FAIL missing state");
    return { ok: false, error: "Missing state." };
  }

  try {
    const redirectUri = chrome.identity.getRedirectURL();
    const url = `${APP_BASE}/extension/connect?${new URLSearchParams({
      state,
      redirect_uri: redirectUri,
    })}`;

    await appendExtensionDebugLog(
      AUTH_LOG,
      `redirectUri=${redirectUri.slice(0, 80)}… connect URL host=${new URL(url).hostname}`,
    );
    slog(`opening launchWebAuthFlow (APP_BASE=${APP_BASE})`);

    const responseUrl = await new Promise<string | undefined>(
      (resolve, reject) => {
        chrome.identity.launchWebAuthFlow(
          { url, interactive: true },
          (finalUrl) => {
            const err = chrome.runtime.lastError;
            if (err) {
              void appendExtensionDebugLog(
                AUTH_LOG,
                `launchWebAuthFlow callback lastError: ${err.message}`,
              );
              slog(`launchWebAuthFlow lastError: ${err.message}`);
              reject(new Error(err.message));
              return;
            }
            void appendExtensionDebugLog(
              AUTH_LOG,
              `launchWebAuthFlow callback finalUrl=${finalUrl ? String(finalUrl).slice(0, 120) + "…" : "(empty)"}`,
            );
            slog(
              `launchWebAuthFlow resolved finalUrl length=${finalUrl?.length ?? 0}`,
            );
            resolve(finalUrl);
          },
        );
      },
    );

    if (!responseUrl) {
      await appendExtensionDebugLog(
        AUTH_LOG,
        "FAIL empty finalUrl (cancelled or closed)",
      );
      slog("FAIL empty finalUrl");
      return {
        ok: false,
        error:
          "Sign-in closed before completing (no redirect with code). Try again.",
      };
    }

    let out: URL;
    try {
      out = new URL(responseUrl);
    } catch {
      await appendExtensionDebugLog(AUTH_LOG, "FAIL parse final URL");
      return { ok: false, error: "Invalid redirect URL." };
    }

    const code = out.searchParams.get("code");
    const back = out.searchParams.get("state");
    if (back !== state) {
      await appendExtensionDebugLog(AUTH_LOG, "FAIL state mismatch");
      return {
        ok: false,
        error: "Security check failed (state mismatch). Try signing in again.",
      };
    }
    if (!code) {
      await appendExtensionDebugLog(AUTH_LOG, "FAIL no code param");
      return {
        ok: false,
        error: "No authorization code in redirect.",
      };
    }

    await appendExtensionDebugLog(AUTH_LOG, "exchanging code…");
    slog("exchanging code");

    const exchanged = await exchangeExtensionCode(code);
    if (!exchanged.ok) {
      await appendExtensionDebugLog(
        AUTH_LOG,
        `exchange FAIL ${exchanged.detail.slice(0, 200)}`,
      );
      slog(`exchange FAIL ${exchanged.detail}`);
      return { ok: false, error: exchanged.detail };
    }

    await chrome.storage.local.set({
      accessToken: exchanged.tokens.accessToken,
      refreshToken: exchanged.tokens.refreshToken,
      clientId: exchanged.tokens.clientId,
      expiresAt: exchanged.tokens.expiresAt,
    });

    await appendExtensionDebugLog(
      AUTH_LOG,
      `OK tokens stored clientId=${exchanged.tokens.clientId.slice(0, 8)}…`,
    );
    slog("OK tokens stored");
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    await appendExtensionDebugLog(AUTH_LOG, `EXCEPTION ${msg}`);
    slog(`EXCEPTION ${msg}`);
    return { ok: false, error: msg || "Sign-in failed." };
  }
}
