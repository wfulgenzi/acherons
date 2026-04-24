"use client";

import { createContext, useContext } from "react";

export type OrgContextValue = {
  orgId: string;
  orgName: string;
  orgType: "dispatch" | "clinic";
  membershipRole: "member" | "admin";
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  value,
  children,
}: {
  value: OrgContextValue;
  children: React.ReactNode;
}) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return ctx;
}
