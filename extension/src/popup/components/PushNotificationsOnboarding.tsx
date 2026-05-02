import { useCallback, useEffect, useState } from "react";
import { APP_BASE } from "@/shared/config";
import {
  getPushOnboardingSnapshot,
  STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS,
  STORAGE_PUSH_REGISTERED,
  snoozePushOnboarding,
} from "@/shared/push-local-state";
import { registerExtensionWebPushFromUi } from "@/shared/register-web-push-ui";

export function PushNotificationsOnboarding() {
  type BannerMode = "hidden" | "subscribe" | "blocked";
  const [mode, setMode] = useState<BannerMode>("hidden");
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const perm = Notification.permission;
    const snap = await getPushOnboardingSnapshot();
    const snoozeOk =
      snap.snoozeUntilMs <= 0 || Date.now() >= snap.snoozeUntilMs;

    if (snap.registered || !snoozeOk) {
      setMode("hidden");
      setHint(null);
      return;
    }

    if (perm === "denied") {
      setMode("blocked");
      setHint(null);
      return;
    }

    setMode("subscribe");
  }, []);

  useEffect(() => {
    void refresh();
    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local") {
        return;
      }
      if (
        STORAGE_PUSH_REGISTERED in changes ||
        STORAGE_PUSH_ONBOARDING_SNOOZE_UNTIL_MS in changes
      ) {
        void refresh();
      }
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, [refresh]);

  if (mode === "hidden") {
    return null;
  }

  if (mode === "blocked") {
    return (
      <div className="mx-3 mb-2 shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-sm">
        <p className="text-[12px] font-semibold leading-snug text-gray-900">
          Notifications are blocked
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
          Chrome won&apos;t show alerts until this extension is allowed under
          site / extension notification settings.
        </p>
        <button
          type="button"
          className="mt-2 rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-gray-800 ring-1 ring-gray-200 hover:bg-gray-100"
          onClick={() => {
            chrome.tabs.create({
              url: "chrome://settings/content/notifications",
            });
          }}
        >
          Open Chrome notification settings
        </button>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 shrink-0 rounded-xl border border-amber-200/90 bg-amber-50/95 px-3 py-2.5 shadow-sm">
      <p className="text-[12px] font-semibold leading-snug text-gray-900">
        Browser alerts for this workspace
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
        Allow us to display a badge notification for events relevant to you.
      </p>
      {hint ? <p className="mt-1.5 text-[11px] text-red-700">{hint}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-vivid disabled:opacity-60"
          onClick={() => {
            setBusy(true);
            setHint(null);
            void registerExtensionWebPushFromUi(APP_BASE)
              .then((r) => {
                void refresh();
                if (r.ok) {
                  setHint(null);
                } else {
                  setHint(r.error ?? "Could not enable alerts.");
                }
              })
              .catch((e: unknown) => {
                setHint(e instanceof Error ? e.message : String(e));
              })
              .finally(() => {
                setBusy(false);
              });
          }}
        >
          {busy ? "Working…" : "Turn on alerts"}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-medium text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 disabled:opacity-60"
          onClick={() => {
            void snoozePushOnboarding(7).then(() => refresh());
          }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
