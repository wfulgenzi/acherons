import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { removePersistedQueryCache } from "../query/query-persist-chrome";
import type { ExtensionMembershipWire } from "@acherons/contracts";
import {
  clearExtensionSessionInStorage,
  getStorageTokens,
} from "@/shared/session";
import { openAppTab } from "@/shared/open-app";
import type { SessionQueryScope } from "../query/session-key";
import { BookingsPanel } from "../panels/BookingsPanel";
import { DashboardPanel } from "../panels/DashboardPanel";
import { ProposalsPanel } from "../panels/ProposalsPanel";
import { RequestsPanel } from "../panels/RequestsPanel";
import { IconSignOut } from "./NavIcons";
import { TopNav, type TabId } from "./TopNav";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { PushNotificationsOnboarding } from "./PushNotificationsOnboarding";

type ShellSession = {
  accessToken: string;
  scope: SessionQueryScope;
};

type Props = {
  membership: ExtensionMembershipWire;
  onSignOut: () => void;
};

function SessionConnecting() {
  return <LoadingPlaceholder fill label="Connecting session…" />;
}

export function Shell({ membership, onSignOut }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>("dashboard");
  const [session, setSession] = useState<ShellSession | null>(null);

  useEffect(() => {
    function applyTokens(t: Record<string, unknown>) {
      const accessToken =
        typeof t.accessToken === "string" && t.accessToken.length > 0
          ? t.accessToken
          : null;
      if (!accessToken) {
        setSession(null);
        return;
      }
      const clientId = typeof t.clientId === "string" ? t.clientId : "";
      const exp = t.expiresAt;
      const expiresAt = typeof exp === "number" ? exp : 0;
      setSession({
        accessToken,
        scope: { clientId, expiresAt },
      });
    }

    void getStorageTokens().then(applyTokens);

    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== "local") {
        return;
      }
      if (
        !(
          "accessToken" in changes ||
          "clientId" in changes ||
          "expiresAt" in changes
        )
      ) {
        return;
      }
      void getStorageTokens().then(applyTokens);
    };
    chrome.storage.onChanged.addListener(onStorage);
    return () => {
      chrome.storage.onChanged.removeListener(onStorage);
    };
  }, []);

  /**
   * Each popup open remounts Shell; refetch dashboard so “Needs your attention”
   * matches push / other tabs without flashing the full-screen loader (cached
   * data keeps `isPending` false during background refetch).
   */
  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }
    void queryClient.invalidateQueries({
      queryKey: ["clinic", "dashboard"],
      exact: false,
    });
  }, [queryClient, session?.accessToken]);

  return (
    <div className="-mx-3 -mt-3 flex min-h-0 flex-1 flex-col bg-brand-100 pt-2">
      <header className="mb-2 flex shrink-0 items-center gap-2 px-3">
        <img
          src="/favicon.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-lg object-contain"
          decoding="async"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-bold leading-tight tracking-tight text-gray-900">
            Acherons HS
          </p>
          <p className="truncate text-[11px] leading-snug text-gray-500">
            {membership.orgName}
          </p>
        </div>
      </header>

      <div className="shrink-0">
        <TopNav
          active={tab}
          onSelect={setTab}
          session={
            session
              ? { accessToken: session.accessToken, scope: session.scope }
              : null
          }
        />
      </div>

      <PushNotificationsOnboarding />

      <div className="mx-3 mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200/70 bg-brand-50 px-2 py-2 shadow-sm">
        <section
          className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain text-gray-700"
          aria-live="polite"
        >
          {tab === "dashboard" &&
            (session ? (
              <DashboardPanel
                accessToken={session.accessToken}
                sessionScope={session.scope}
              />
            ) : (
              <SessionConnecting />
            ))}
          {tab === "requests" &&
            (session ? (
              <RequestsPanel
                accessToken={session.accessToken}
                sessionScope={session.scope}
              />
            ) : (
              <SessionConnecting />
            ))}
          {tab === "proposals" &&
            (session ? (
              <ProposalsPanel
                accessToken={session.accessToken}
                sessionScope={session.scope}
              />
            ) : (
              <SessionConnecting />
            ))}
          {tab === "bookings" &&
            (session ? (
              <BookingsPanel
                accessToken={session.accessToken}
                sessionScope={session.scope}
              />
            ) : (
              <SessionConnecting />
            ))}
        </section>
      </div>

      <footer className="mt-auto shrink-0 border-t border-gray-200/70 bg-brand-100 px-3 pb-1.5 pt-1.5">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            className="!inline-flex !w-auto max-w-none items-center gap-1 rounded px-0.5 py-1 text-[10px] font-medium text-brand-700 underline decoration-brand-600/35 underline-offset-2 hover:text-brand-800"
            onClick={() => {
              openAppTab("/dashboard");
            }}
          >
            Open full app
            <span aria-hidden className="text-[9px] opacity-70">
              ↗
            </span>
          </button>
          <button
            type="button"
            className="!inline-flex !w-auto shrink-0 items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-200/70 hover:text-gray-900"
            aria-label="Sign out of this extension"
            title="Sign out"
            onClick={() => {
              void clearExtensionSessionInStorage().then(async () => {
                await removePersistedQueryCache();
                queryClient.clear();
                onSignOut();
              });
            }}
          >
            <IconSignOut className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
