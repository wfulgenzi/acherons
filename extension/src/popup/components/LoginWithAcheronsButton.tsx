import { useCallback, useState } from "react";
import { appendExtensionDebugLog } from "@/shared/extension-debug-log";
import {
  MESSAGE_EXTENSION_LAUNCH_AUTH,
  sendExtensionMessage,
} from "@/shared/messages";
import { openAppTab } from "@/shared/open-app";
import { InlineSpinner } from "./InlineSpinner";

type Props = {
  onConnected: () => void;
  onLog: (msg: string, cls?: "ok" | "err") => void;
  label?: string;
};

function randomState(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function LoginWithAcheronsButton({
  onConnected,
  onLog,
  label = "Log in",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [loginHelpMessage, setLoginHelpMessage] = useState(false);

  const run = useCallback(async () => {
    setBusy(true);
    setLoginHelpMessage(false);
    onLog("Opening sign-in…");
    const state = randomState();
    await appendExtensionDebugLog(
      "popup",
      `Login button clicked; sending EXTENSION_LAUNCH_AUTH stateLen=${state.length}`,
    );
    try {
      const r = await sendExtensionMessage({
        type: MESSAGE_EXTENSION_LAUNCH_AUTH,
        state,
      });
      if (!r.ok) {
        void appendExtensionDebugLog(
          "popup",
          `EXTENSION_LAUNCH_AUTH response ok=false ${r.error ?? ""}`.slice(0, 200),
        );
        onLog(r.error ?? "Sign-in failed.", "err");
        setLoginHelpMessage(true);
        return;
      }
      void appendExtensionDebugLog("popup", "EXTENSION_LAUNCH_AUTH response ok=true");
      onLog("Signed in.", "ok");
      onConnected();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      void appendExtensionDebugLog("popup", `sendExtensionMessage threw: ${msg}`);
      onLog(msg, "err");
      setLoginHelpMessage(true);
    } finally {
      setBusy(false);
    }
  }, [onConnected, onLog]);

  return (
    <div className="flex flex-col gap-3">
      {loginHelpMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-snug text-amber-950"
        >
          <p className="font-medium">Couldn&apos;t complete sign-in</p>
          <p className="mt-1 text-amber-900/90">
            Error logging in at this time. Please sign in using the web app, then
            try again here if needed.
          </p>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 underline decoration-brand-600/40 underline-offset-2 hover:text-brand-vivid"
            onClick={() => {
              openAppTab("/login");
            }}
          >
            Open app sign-in
          </button>
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-vivid disabled:opacity-70"
        onClick={() => {
          void run();
        }}
      >
        {busy ? (
          <>
            <InlineSpinner className="text-white" />
            <span>Logging in…</span>
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
