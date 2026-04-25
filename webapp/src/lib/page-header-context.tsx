"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";

export type PageHeaderValue = {
  title: string;
  subtitle?: string;
  /** Toolbar controls shown before the notifications bell. */
  actions?: ReactNode;
};

type Ctx = {
  header: PageHeaderValue | null;
  setPageHeader: (v: PageHeaderValue | null) => void;
};

const PageHeaderContext = createContext<Ctx | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<PageHeaderValue | null>(null);
  const setPageHeader = useCallback((v: PageHeaderValue | null) => {
    setHeader(v);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ header, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return ctx;
}

export function SetPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { setPageHeader } = usePageHeader();
  useLayoutEffect(() => {
    setPageHeader({ title, subtitle, actions });
    return () => setPageHeader(null);
  }, [title, subtitle, actions, setPageHeader]);
  return null;
}
