/* global checkExtensionSession, clearExtensionSessionInStorage, APP_BASE */
(function () {
  const APP = typeof APP_BASE !== "undefined" ? APP_BASE : "http://localhost:3000";
  const baseEl = document.getElementById("app-base");
  if (baseEl) {
    baseEl.textContent = APP;
  }

  const badge = document.getElementById("badge");
  const detail = document.getElementById("detail");

  function applyResult(r) {
    if (r.state === "ok") {
      badge.className = "badge-ok";
      badge.textContent = "Connected";
      const exp =
        r.expiresAt == null ? "" : " Access exp (unix s): " + r.expiresAt;
      detail.textContent = r.detail + exp;
      return;
    }
    if (r.state === "no_tokens") {
      badge.className = "badge-na";
      badge.textContent = "Not connected";
      detail.textContent = r.detail;
      return;
    }
    if (r.state === "unauth") {
      badge.className = "badge-mid";
      badge.textContent = "Session lost";
      detail.textContent = r.detail;
      return;
    }
    if (r.state === "net") {
      badge.className = "badge-mid";
      badge.textContent = "Unreachable";
      detail.textContent = r.detail;
      return;
    }
    badge.className = "badge-bad";
    badge.textContent = "Error";
    detail.textContent = r.detail;
  }

  async function runCheck() {
    badge.className = "badge-na";
    badge.textContent = "Checking…";
    detail.textContent = "…";
    try {
      const r = await checkExtensionSession();
      applyResult(r);
    } catch (e) {
      badge.className = "badge-bad";
      badge.textContent = "Error";
      detail.textContent = e && e.message ? e.message : String(e);
    }
  }

  document.getElementById("refresh").addEventListener("click", runCheck);
  document.getElementById("sign-out").addEventListener("click", () => {
    void clearExtensionSessionInStorage().then(() => {
      return runCheck();
    });
  });
  runCheck();
})();
