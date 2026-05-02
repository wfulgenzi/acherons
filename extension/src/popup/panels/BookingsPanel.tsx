import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ExtensionClinicBookingItem } from "@acherons/contracts";
import { fetchClinicBookingsQuery } from "@/shared/api/clinic-query-fns";
import {
  formatBookingRangeLine,
  formatRelativeListTime,
} from "@/shared/datetime";
import { genderShort } from "@/shared/patient-display";
import { openAppTab } from "@/shared/open-app";
import {
  sessionQueryKeyPart,
  type SessionQueryScope,
} from "../query/session-key";
import { AppFooterLink } from "../components/AppFooterLink";
import { ListRowCard } from "../components/ListRowCard";
import { LoadingPlaceholder } from "../components/LoadingPlaceholder";
import { QueryErrorPanel } from "../components/QueryErrorPanel";
import { STALE_LIST_MS } from "../query/stale-times";

type Props = {
  accessToken: string;
  sessionScope: SessionQueryScope;
};

export function BookingsPanel({ accessToken, sessionScope }: Props) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [
      "clinic",
      "bookings",
      ...sessionQueryKeyPart(sessionScope),
    ],
    queryFn: () => fetchClinicBookingsQuery(accessToken),
    staleTime: STALE_LIST_MS,
    enabled: Boolean(accessToken),
  });

  const items = data?.items;
  const todayIso = data?.todayIso;

  const { upcoming, past } = useMemo(() => {
    if (items === undefined || todayIso === undefined) {
      return {
        upcoming: [] as ExtensionClinicBookingItem[],
        past: [] as ExtensionClinicBookingItem[],
      };
    }
    const nowMs = new Date(todayIso).getTime();
    const upcomingList: ExtensionClinicBookingItem[] = [];
    const pastList: ExtensionClinicBookingItem[] = [];
    for (const row of items) {
      const t = new Date(row.confirmedStart).getTime();
      if (Number.isNaN(t)) {
        continue;
      }
      if (t >= nowMs) {
        upcomingList.push(row);
      } else {
        pastList.push(row);
      }
    }
    upcomingList.sort(
      (a, b) =>
        new Date(a.confirmedStart).getTime() -
        new Date(b.confirmedStart).getTime(),
    );
    pastList.sort(
      (a, b) =>
        new Date(b.confirmedStart).getTime() -
        new Date(a.confirmedStart).getTime(),
    );
    return { upcoming: upcomingList, past: pastList };
  }, [items, todayIso]);

  if (isPending) {
    return <LoadingPlaceholder fill label="Loading bookings…" />;
  }

  if (isError || items === undefined || todayIso === undefined) {
    return <QueryErrorPanel error={error} onRetry={() => void refetch()} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed text-gray-600">
          You don&apos;t have any bookings yet.
        </p>
        <AppFooterLink path="/bookings">Open bookings in browser</AppFooterLink>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
      <p className="text-[11px] text-gray-400">
        {items.length} booking{items.length === 1 ? "" : "s"}
      </p>

      {upcoming.length > 0 ? (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Upcoming
          </p>
          <ul className="flex flex-col gap-2">
            {upcoming.map((item) => (
              <BookingRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Past
          </p>
          <ul className="flex flex-col gap-2">
            {past.slice(0, 8).map((item) => (
              <BookingRow key={item.id} item={item} />
            ))}
          </ul>
          {past.length > 8 ? (
            <p className="mt-1 text-[10px] text-gray-400">
              +{past.length - 8} more in browser
            </p>
          ) : null}
        </section>
      ) : null}

      {upcoming.length === 0 && past.length > 0 ? (
        <p className="text-sm text-gray-600">No upcoming bookings.</p>
      ) : null}

      {upcoming.length === 0 &&
      past.length === 0 &&
      items.length > 0 ? (
        <p className="text-sm text-gray-600">
          Could not categorise bookings by date.
        </p>
      ) : null}

      <AppFooterLink path="/bookings">Full bookings in browser</AppFooterLink>
    </div>
  );
}

function BookingRow({ item }: { item: ExtensionClinicBookingItem }) {
  return (
    <li>
      <ListRowCard
        onClick={() => {
          openAppTab(`/requests/${item.requestId}`);
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] font-semibold leading-tight text-gray-900">
            Age {item.patientAge ?? "—"}
            <span className="font-normal text-gray-300"> · </span>
            {genderShort(item.patientGender)}
          </p>
          <span className="shrink-0 pt-px text-right text-[10px] leading-tight text-gray-400 tabular-nums">
            {formatRelativeListTime(item.confirmedStart)}
          </span>
        </div>
        <p className="mt-2 line-clamp-3 text-[13px] font-normal leading-snug text-gray-500">
          {item.caseDescription}
        </p>
        <p className="mt-1 text-[11px] text-gray-600">
          {formatBookingRangeLine(item.confirmedStart, item.confirmedEnd)}
        </p>
      </ListRowCard>
    </li>
  );
}
