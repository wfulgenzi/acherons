import { useQuery } from "@tanstack/react-query";
import type { ExtensionClinicDashboardResponse } from "@acherons/contracts";
import { fetchClinicDashboardQuery } from "@/shared/api/clinic-query-fns";
import {
  formatClockTime,
  formatDurationShort,
  formatRelativeListTime,
  sortByIsoFieldDesc,
} from "@/shared/datetime";
import { openAppTab } from "@/shared/open-app";
import {
  sessionQueryKeyPart,
  type SessionQueryScope,
} from "../query/session-key";
import { QueryErrorPanel } from "../components/QueryErrorPanel";
import { LoadingPlaceholder } from "../components/LoadingPlaceholder";
import { STALE_DASHBOARD_MS } from "../query/stale-times";

type DashboardInboxItem = ExtensionClinicDashboardResponse["newItems"][number];
type DashboardNewRequestItem =
  ExtensionClinicDashboardResponse["newRequestsItems"][number];
type DashboardTodayItem =
  ExtensionClinicDashboardResponse["todayScheduleItems"][number];

type Props = {
  accessToken: string;
  sessionScope: SessionQueryScope;
};

const ATTENTION_DOT = ["bg-red-500", "bg-amber-400", "bg-brand-500"] as const;

export function DashboardPanel({ accessToken, sessionScope }: Props) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["clinic", "dashboard", ...sessionQueryKeyPart(sessionScope)],
    queryFn: () => fetchClinicDashboardQuery(accessToken),
    staleTime: STALE_DASHBOARD_MS,
    enabled: Boolean(accessToken),
  });

  if (isPending) {
    return <LoadingPlaceholder fill label="Loading dashboard…" />;
  }

  if (isError || !data) {
    return <QueryErrorPanel error={error} onRetry={() => void refetch()} />;
  }

  const attentionFromRequests = sortByIsoFieldDesc(
    data.newRequestsItems,
    (r) => r.createdAt,
  ).slice(0, 5);
  const attentionFallbackInbox =
    attentionFromRequests.length === 0
      ? sortByIsoFieldDesc(data.newItems, (r) => r.createdAt).slice(0, 5)
      : [];
  const attentionCount =
    attentionFromRequests.length > 0
      ? attentionFromRequests.length
      : data.newItems.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 text-sm">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain">
        <section
          className="shrink-0 overflow-hidden rounded-xl border border-amber-200/90 bg-[#FEF9EB] shadow-sm"
          aria-labelledby="dash-attention-heading"
        >
          <div className="flex items-center justify-between gap-2 border-b border-amber-200/70 px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800"
                aria-hidden
              >
                !
              </span>
              <h2
                id="dash-attention-heading"
                className="text-[10px] font-bold uppercase tracking-wide text-gray-800"
              >
                Needs your attention
              </h2>
            </div>
            {attentionCount > 0 ? (
              <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand-800">
                {attentionCount}
              </span>
            ) : null}
          </div>
          {attentionFromRequests.length > 0 ? (
            <ul className="divide-y divide-amber-200/60">
              {attentionFromRequests.map((row, i) => (
                <AttentionRequestRow
                  key={row.id}
                  row={row}
                  dotClass={ATTENTION_DOT[i % ATTENTION_DOT.length]!}
                />
              ))}
            </ul>
          ) : attentionFallbackInbox.length > 0 ? (
            <ul className="divide-y divide-amber-200/60">
              {attentionFallbackInbox.map((row, i) => (
                <AttentionInboxRow
                  key={row.id}
                  row={row}
                  dotClass={ATTENTION_DOT[i % ATTENTION_DOT.length]!}
                />
              ))}
            </ul>
          ) : (
            <p className="px-2.5 py-3 text-xs text-gray-500">
              You&apos;re all caught up.
            </p>
          )}
        </section>
      </div>

      <section
        className="shrink-0 border-t border-gray-200/80 pt-2"
        aria-labelledby="dash-today-heading"
      >
        <div className="flex items-center justify-between gap-2 px-0.5 pb-1.5">
          <h2
            id="dash-today-heading"
            className="text-[10px] font-bold uppercase tracking-wide text-gray-700"
          >
            Today
          </h2>
          {data.todayScheduleItems.length > 0 ? (
            <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand-800">
              {data.todayScheduleItems.length}
            </span>
          ) : null}
        </div>
        {data.todayScheduleItems.length > 0 ? (
          <ul className="divide-y divide-gray-200/70">
            {data.todayScheduleItems.slice(0, 6).map((row) => (
              <TodayRow key={row.id} row={row} />
            ))}
          </ul>
        ) : (
          <p className="px-0.5 py-1 text-xs text-gray-500">
            No bookings on your schedule today.
          </p>
        )}
      </section>
    </div>
  );
}

function AttentionRequestRow({
  row,
  dotClass,
}: {
  row: DashboardNewRequestItem;
  dotClass: string;
}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-start gap-2 px-2.5 py-2.5 text-left transition-colors hover:bg-amber-100/50"
        onClick={() => {
          openAppTab(`/requests/${row.id}`);
        }}
      >
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug text-gray-900 line-clamp-2">
            {row.caseDescription}
          </p>
          {row.patientAge != null ? (
            <p className="mt-0.5 text-[10px] text-gray-500">
              Age {row.patientAge}y
            </p>
          ) : null}
        </div>
        <span className="shrink-0 pt-1 text-sm text-gray-300" aria-hidden>
          ›
        </span>
      </button>
    </li>
  );
}

function AttentionInboxRow({
  row,
  dotClass,
}: {
  row: DashboardInboxItem;
  dotClass: string;
}) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-start gap-2 px-2.5 py-2.5 text-left transition-colors hover:bg-amber-100/50"
        onClick={() => {
          openAppTab("/dashboard");
        }}
      >
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug text-gray-900 line-clamp-2">
            {row.label}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-500">
            {formatRelativeListTime(row.createdAt)}
          </p>
        </div>
        <span className="shrink-0 pt-1 text-sm text-gray-300" aria-hidden>
          ›
        </span>
      </button>
    </li>
  );
}

function TodayRow({ row }: { row: DashboardTodayItem }) {
  const dur = formatDurationShort(row.confirmedStart, row.confirmedEnd);
  const age = row.patientAge != null ? `${row.patientAge}y` : "—";
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-2.5 py-2.5 text-left transition-colors hover:bg-brand-50/80"
        onClick={() => {
          openAppTab("/dashboard");
        }}
      >
        <span className="shrink-0 rounded-lg bg-brand-100 px-2 py-1 text-[11px] font-semibold tabular-nums text-brand-900">
          {formatClockTime(row.confirmedStart)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold leading-snug text-gray-900 line-clamp-2">
            {row.caseDescription}
          </p>
          <p className="mt-0.5 text-[10px] text-gray-500">
            Age {age} · {dur}
          </p>
        </div>
        <span className="shrink-0 text-sm text-gray-300" aria-hidden>
          ›
        </span>
      </button>
    </li>
  );
}
