import { useQuery, useQueryClient, useIsRestoring } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExtensionMembershipWire } from "@acherons/contracts";
import { getStorageTokens } from "@/shared/session";
import {
  sessionQueryKeyPart,
  type SessionQueryScope,
} from "./session-key";
import { fetchExtensionGateQuery, type ExtensionGateData } from "./extension-gate-query";

export type GateView =
  | "loading"
  | "logged_out"
  | "session_error"
  | "loading_me"
  | "onboarding"
  | "dispatcher"
  | "clinic";

export type UseExtensionGateResult = {
  view: GateView;
  /** Set when `view === "clinic"` or `"dispatcher"` */
  membership: ExtensionMembershipWire | null;
  /** Session / `/me` diagnostics for error states */
  detail: string;
  /** `forceRefreshMe` bypasses cached `/api/extension/me` (API2 + TanStack persist). */
  refresh: (forceRefreshMe?: boolean) => void;
};

type TokenGateState =
  | "loading"
  | "none"
  | { accessToken: string; scope: SessionQueryScope };

const GATE_STALE_MS = 5 * 60 * 1000;

function viewFromGateData(data: ExtensionGateData): Exclude<
  GateView,
  "loading" | "logged_out" | "session_error" | "loading_me"
> {
  switch (data.kind) {
    case "onboarding":
      return "onboarding";
    case "dispatcher":
      return "dispatcher";
    case "clinic":
      return "clinic";
  }
}

export function useExtensionGate(): UseExtensionGateResult {
  const queryClient = useQueryClient();
  const isRestoring = useIsRestoring();
  const forceMeRef = useRef(false);

  const [tokenGate, setTokenGate] = useState<TokenGateState>("loading");

  useEffect(() => {
    function applyTokens(t: Record<string, unknown>) {
      const accessToken =
        typeof t.accessToken === "string" && t.accessToken.length > 0
          ? t.accessToken
          : null;
      if (!accessToken) {
        setTokenGate("none");
        return;
      }
      const clientId = typeof t.clientId === "string" ? t.clientId : "";
      const exp = t.expiresAt;
      const expiresAt = typeof exp === "number" ? exp : 0;
      setTokenGate({
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

  const gateQuery = useQuery({
    queryKey:
      tokenGate !== "loading" && tokenGate !== "none"
        ? (["extension", "gate", ...sessionQueryKeyPart(tokenGate.scope)] as const)
        : (["extension", "gate", "__no_session__"] as const),
    queryFn: async () => {
      const forceMe = forceMeRef.current;
      forceMeRef.current = false;
      return fetchExtensionGateQuery({ forceMe });
    },
    enabled: tokenGate !== "loading" && tokenGate !== "none",
    staleTime: GATE_STALE_MS,
  });

  const refresh = useCallback(
    (forceRefreshMe?: boolean) => {
      forceMeRef.current = !!forceRefreshMe;
      void queryClient.invalidateQueries({ queryKey: ["extension", "gate"] });
    },
    [queryClient],
  );

  if (tokenGate === "loading") {
    return {
      view: "loading",
      membership: null,
      detail: "",
      refresh,
    };
  }

  if (tokenGate === "none") {
    return {
      view: "logged_out",
      membership: null,
      detail: "",
      refresh,
    };
  }

  if (
    isRestoring &&
    gateQuery.data === undefined &&
    !gateQuery.isError
  ) {
    return {
      view: "loading",
      membership: null,
      detail: "",
      refresh,
    };
  }

  if (gateQuery.isError) {
    const err = gateQuery.error;
    return {
      view: "session_error",
      membership: null,
      detail: err instanceof Error ? err.message : "Unknown error.",
      refresh,
    };
  }

  if (gateQuery.data === undefined) {
    return {
      view: "loading_me",
      membership: null,
      detail: "",
      refresh,
    };
  }

  const data = gateQuery.data;
  const membership =
    data.kind === "dispatcher" || data.kind === "clinic"
      ? data.membership
      : null;

  return {
    view: viewFromGateData(data),
    membership,
    detail: "",
    refresh,
  };
}
