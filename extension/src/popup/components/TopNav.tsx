import { useQuery } from "@tanstack/react-query";
import type { ComponentType, SVGProps } from "react";
import { fetchClinicDashboardQuery } from "@/shared/api/clinic-query-fns";
import {
  sessionQueryKeyPart,
  type SessionQueryScope,
} from "../query/session-key";
import { STALE_DASHBOARD_MS } from "../query/stale-times";
import {
  IconBookings,
  IconDashboard,
  IconProposals,
  IconRequests,
} from "./NavIcons";

export type TabId = "dashboard" | "requests" | "proposals" | "bookings";

type NavEntry = {
  id: TabId;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const ITEMS: NavEntry[] = [
  { id: "dashboard", label: "Home", Icon: IconDashboard },
  { id: "requests", label: "Requests", Icon: IconRequests },
  { id: "proposals", label: "Proposals", Icon: IconProposals },
  { id: "bookings", label: "Bookings", Icon: IconBookings },
];

type SessionProps = {
  accessToken: string;
  scope: SessionQueryScope;
};

type Props = {
  active: TabId;
  onSelect: (id: TabId) => void;
  /** When set, loads dashboard stats for the Requests attention dot (TanStack dedupes with dashboard panel). */
  session: SessionProps | null;
};

/** Orange dot when there is more than one new request (same threshold as product mock). */
export function TopNav({ active, onSelect, session }: Props) {
  const requestsDot = useQuery({
    queryKey: [
      "clinic",
      "dashboard",
      ...(session ? sessionQueryKeyPart(session.scope) : []),
    ],
    queryFn: () => fetchClinicDashboardQuery(session!.accessToken),
    enabled: Boolean(session?.accessToken),
    staleTime: STALE_DASHBOARD_MS,
    select: (d) => d.statCards.newRequestsCount > 1,
  });

  const showRequestsDot = requestsDot.data === true;

  return (
    <nav
      className="grid w-full grid-cols-4 gap-0 border-y border-gray-200/70 bg-brand-100"
      aria-label="Workspace sections"
    >
      {ITEMS.map(({ id, label, Icon }) => {
        const isOn = active === id;
        const dot =
          id === "requests" && showRequestsDot ? (
            <span
              className="pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"
              aria-hidden
            />
          ) : null;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onSelect(id);
            }}
            className={`relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 border-r border-gray-200/50 px-0.5 py-1.5 transition-colors last:border-r-0 ${
              isOn
                ? "border-b-[3px] border-brand-600 bg-brand-50 text-brand-800 hover:bg-brand-50"
                : "border-b-[3px] border-transparent bg-white text-brand-800 hover:bg-amber-50 hover:text-brand-800"
            }`}
          >
            <span className="relative inline-flex shrink-0">
              {dot}
              <Icon className="h-6 w-6 shrink-0" aria-hidden />
            </span>
            <span className="w-full whitespace-normal text-center text-[9px] font-semibold uppercase leading-[1.05] tracking-tight text-balance">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
