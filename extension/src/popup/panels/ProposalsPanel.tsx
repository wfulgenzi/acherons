import { useQuery } from "@tanstack/react-query";
import type { ExtensionClinicProposalItem } from "@acherons/contracts";
import { fetchClinicProposalsQuery } from "@/shared/api/clinic-query-fns";
import {
  formatProposedSlotLine,
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

export function ProposalsPanel({ accessToken, sessionScope }: Props) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: [
      "clinic",
      "proposals",
      ...sessionQueryKeyPart(sessionScope),
    ],
    queryFn: () => fetchClinicProposalsQuery(accessToken),
    staleTime: STALE_LIST_MS,
    enabled: Boolean(accessToken),
  });

  const items = data?.items;

  if (isPending) {
    return <LoadingPlaceholder fill label="Loading proposals…" />;
  }

  if (isError || items === undefined) {
    return <QueryErrorPanel error={error} onRetry={() => void refetch()} />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed text-gray-600">
          You don&apos;t have any proposals currently pending.
        </p>
        <AppFooterLink path="/proposals">Open proposals in browser</AppFooterLink>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
      <p className="text-[11px] text-gray-400">
        {items.length} pending proposal{items.length === 1 ? "" : "s"}
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id}>
            <ProposalRow item={item} />
          </li>
        ))}
      </ul>
      <AppFooterLink path="/proposals">All proposals in browser</AppFooterLink>
    </div>
  );
}

function ProposalRow({ item }: { item: ExtensionClinicProposalItem }) {
  return (
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
          {formatRelativeListTime(item.submittedAt)}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-[13px] font-normal leading-snug text-gray-500">
        {item.caseDescription}
      </p>
      <p className="mt-1 text-[11px] text-gray-600">
        {formatProposedSlotLine(item.proposedStart, item.proposedEnd)}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        REQ-{item.requestShortId}
      </p>
    </ListRowCard>
  );
}
