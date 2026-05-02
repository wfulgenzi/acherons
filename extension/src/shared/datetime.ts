/**
 * Extension popup: en-GB dates/times and relative labels for list rows.
 */

/** Clock time only (e.g. booking row time badge). */
export function formatClockTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export function formatDurationShort(startIso: string, endIso: string): string {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "—";
  }
  const mins = Math.round((end - start) / 60_000);
  if (mins <= 0) {
    return "—";
  }
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

/**
 * Relative labels for list rows (created/submitted/booking start).
 * Under one hour: "Just now" or "N minute(s) ago".
 * Under one day: "N hour(s) ago".
 * Under one week: "N day(s) ago".
 * Otherwise: absolute date/time (en-GB).
 */
export function formatRelativeListTime(iso: string, nowMs = Date.now()): string {
  const d = new Date(iso);
  const t = d.getTime();
  if (Number.isNaN(t)) {
    return "—";
  }

  const diffMs = nowMs - t;
  if (diffMs < 0) {
    return formatExactDateTime(iso);
  }

  const totalMins = Math.floor(diffMs / 60_000);
  if (totalMins < 60) {
    if (totalMins < 1) {
      return "Just now";
    }
    return `${totalMins} minute${totalMins === 1 ? "" : "s"} ago`;
  }

  const totalHours = Math.floor(diffMs / 3_600_000);
  if (totalHours < 24) {
    return `${totalHours} hour${totalHours === 1 ? "" : "s"} ago`;
  }

  const totalDays = Math.floor(diffMs / 86_400_000);
  if (totalDays < 7) {
    return `${totalDays} day${totalDays === 1 ? "" : "s"} ago`;
  }

  return formatExactDateTime(iso);
}

function formatExactDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Proposed slot line for proposals list (date, time, optional duration). */
export function formatProposedSlotLine(
  proposedStart: string | null,
  proposedEnd: string | null,
): string {
  if (!proposedStart) {
    return "—";
  }
  const start = new Date(proposedStart);
  if (Number.isNaN(start.getTime())) {
    return "—";
  }
  const end = proposedEnd ? new Date(proposedEnd) : null;
  const durationMins =
    end && !Number.isNaN(end.getTime())
      ? Math.round((end.getTime() - start.getTime()) / 60_000)
      : null;
  const datePart = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return durationMins != null
    ? `${datePart}, ${timePart} · ${durationMins} min`
    : `${datePart}, ${timePart}`;
}

/** Confirmed booking range for bookings list. */
export function formatBookingRangeLine(
  startIso: string,
  endIso: string,
): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime())) {
    return "—";
  }
  const datePart = start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const startT = start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endT = Number.isNaN(end.getTime())
    ? ""
    : end.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
  const durationMins = Number.isNaN(end.getTime())
    ? null
    : Math.round((end.getTime() - start.getTime()) / 60_000);
  const timeLine =
    endT && durationMins != null
      ? `${startT}–${endT} (${durationMins} min)`
      : startT;
  return `${datePart} · ${timeLine}`;
}

/** Latest / newest first (descending by ISO-8601 instant). */
export function compareIsoDesc(aIso: string, bIso: string): number {
  return Date.parse(bIso) - Date.parse(aIso);
}

export function sortByIsoFieldDesc<T>(
  rows: readonly T[],
  getIso: (row: T) => string,
): T[] {
  return [...rows].sort((a, b) => compareIsoDesc(getIso(a), getIso(b)));
}
