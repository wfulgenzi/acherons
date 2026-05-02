import { useQuery } from "@tanstack/react-query";
import type { ExtensionClinicRequestItem } from "@acherons/contracts";
import { fetchClinicRequestsQuery } from "@/shared/api/clinic-query-fns";
import { formatRelativeListTime, sortByIsoFieldDesc } from "@/shared/datetime";
import { genderShort, proposalStatusLabel } from "@/shared/patient-display";
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

export function RequestsPanel({ accessToken, sessionScope }: Props) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [
      "clinic",
      "requests",
      ...sessionQueryKeyPart(sessionScope),
    ],
    queryFn: () => fetchClinicRequestsQuery(accessToken),
    staleTime: STALE_LIST_MS,
    enabled: Boolean(accessToken),
  });

  if (isPending) {
    return <LoadingPlaceholder fill label="Loading requests…" />;
  }

  if (isError || data === undefined) {
    return <QueryErrorPanel error={error} onRetry={() => void refetch()} />;
  }

  const items = sortByIsoFieldDesc(data.items, (r) => r.createdAt);

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-gray-600">No new requests right now.</p>
        <AppFooterLink path="/requests">Open requests in browser</AppFooterLink>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
      <p className="text-[11px] text-gray-400">
        {items.length} request{items.length === 1 ? "" : "s"}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <RequestRow item={item} />
          </li>
        ))}
      </ul>
      <AppFooterLink path="/requests">All requests in browser</AppFooterLink>
    </div>
  );
}

function RequestRow({ item }: { item: ExtensionClinicRequestItem }) {
  const statusLine = proposalStatusLabel(item.proposalStatus);
  return (
    <ListRowCard
      onClick={() => {
        openAppTab(`/requests/${item.id}`);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold leading-tight text-gray-900">
          Age {item.patientAge ?? "—"}
          <span className="font-normal text-gray-300"> · </span>
          {genderShort(item.patientGender)}
        </p>
        <span className="shrink-0 pt-px text-right text-[10px] leading-tight text-gray-400 tabular-nums">
          {formatRelativeListTime(item.createdAt)}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-[13px] font-normal leading-snug text-gray-500">
        {item.caseDescription}
      </p>
      {statusLine ? (
        <p className="mt-1 text-[11px] font-medium text-brand-700">
          {statusLine}
        </p>
      ) : null}
    </ListRowCard>
  );
}
