import type { ReactNode } from "react";
import { openAppTab } from "@/shared/open-app";

type Props = {
  path: string;
  children: ReactNode;
};

export function AppFooterLink({ path, children }: Props) {
  return (
    <button
      type="button"
      className="text-left text-xs font-semibold text-brand-600 underline decoration-brand-600/40 underline-offset-2 hover:text-brand-vivid"
      onClick={() => {
        openAppTab(path);
      }}
    >
      {children}
    </button>
  );
}
