import type { ReactNode } from "react";

type Props = {
  onClick: () => void;
  children: ReactNode;
};

/** Full-width list row: bordered card button (matches Requests / Proposals / Bookings). */
export function ListRowCard({ onClick, children }: Props) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-2 rounded-lg border border-gray-100 bg-white px-2 py-2.5 text-left font-normal leading-snug shadow-sm transition-colors hover:bg-brand-50/80"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">{children}</div>
    </button>
  );
}
