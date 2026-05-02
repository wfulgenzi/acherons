import { useEffect } from "react";
import { clearExtensionToolbarBadge } from "@/shared/extension-toolbar-badge";
import { clearExtensionSessionInStorage } from "@/shared/session";
import { openAppTab } from "@/shared/open-app";
import { Shell } from "./components/Shell";
import { LoadingPlaceholder } from "./components/LoadingPlaceholder";
import { LoginWithAcheronsButton } from "./components/LoginWithAcheronsButton";
import { useExtensionGate } from "./query/useExtensionGate";

function noopLog(_msg: string, _cls?: "ok" | "err"): void {}

export function PopupApp() {
  const { view, membership, detail, refresh } = useExtensionGate();

  useEffect(() => {
    clearExtensionToolbarBadge();
  }, []);

  const shell = (() => {
    if (view === "loading" || view === "loading_me") {
      return (
        <LoadingPlaceholder
          fill
          label={
            view === "loading_me"
              ? "Loading your workspace…"
              : "Loading…"
          }
        />
      );
    }

    if (view === "logged_out") {
      return (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1 text-2xl" aria-hidden="true">
              👋
            </p>
            <h1 className="text-base font-semibold text-gray-900">
              Acherons HS
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Log in to your account to continue.
            </p>
          </div>
          <LoginWithAcheronsButton
            onConnected={() => {
              void refresh();
            }}
            onLog={noopLog}
          />
        </div>
      );
    }

    if (view === "session_error") {
      return (
        <div className="flex flex-col gap-3">
          <h1 className="text-base font-semibold text-gray-900">
            Can&apos;t connect
          </h1>
          <p className="text-sm text-gray-600">{detail || "Unknown error."}</p>
          <LoginWithAcheronsButton
            label="Sign in again"
            onConnected={() => {
              void refresh();
            }}
            onLog={noopLog}
          />
          <button
            type="button"
            className="w-full rounded-lg py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
            onClick={() => {
              void clearExtensionSessionInStorage().then(() => refresh());
            }}
          >
            Clear extension session
          </button>
        </div>
      );
    }

    if (view === "onboarding") {
      return (
        <div className="flex flex-col gap-3">
          <p className="text-2xl" aria-hidden="true">
            👋
          </p>
          <h1 className="text-base font-semibold text-gray-900">
            No workspace yet
          </h1>
          <p className="text-sm leading-relaxed text-gray-500">
            Welcome to your Acherons HS dashboard. You don&apos;t currently have a
            project workspace. Ask your workspace administrator to add you to the
            project, or contact us about creating your project.
          </p>
          <button
            type="button"
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid"
            onClick={() => {
              openAppTab("/onboarding");
            }}
          >
            Open onboarding in browser
          </button>
          <button
            type="button"
            className="w-full rounded-lg py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
            onClick={() => {
              void clearExtensionSessionInStorage().then(() => refresh());
            }}
          >
            Sign out (this extension)
          </button>
        </div>
      );
    }

    if (view === "dispatcher") {
      return (
        <div className="flex flex-col gap-3">
          <h1 className="text-base font-semibold text-gray-900">Acherons HS</h1>
          <button
            type="button"
            className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-vivid"
            onClick={() => {
              openAppTab("/dashboard");
            }}
          >
            Open in browser
          </button>
          <button
            type="button"
            className="w-full rounded-lg py-2 text-sm font-medium text-gray-500 hover:text-gray-800"
            onClick={() => {
              void clearExtensionSessionInStorage().then(() => refresh());
            }}
          >
            Sign out (this extension)
          </button>
        </div>
      );
    }

    if (view === "clinic" && membership) {
      return (
        <Shell
          membership={membership}
          onSignOut={() => {
            void refresh();
          }}
        />
      );
    }

    return null;
  })();

  return (
    <div className="popup-shell box-border flex h-full min-h-0 w-full flex-1 flex-col bg-brand-100 px-3 pb-2 pt-3">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{shell}</div>
    </div>
  );
}
