export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function getDurationMins(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatPatient(
  age: number | null,
  gender: string | null,
): string {
  const parts: string[] = [];
  if (age != null) {
    parts.push(`${age}y`);
  }
  if (gender && gender !== "unknown") {
    parts.push(capitalize(gender));
  }
  return parts.length ? parts.join(" · ") : "Unknown patient";
}
