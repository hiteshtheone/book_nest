export const SEASON_START = "2026-11-01";
export const SEASON_END = "2026-12-31";
export const KICKOFF_START = "2026-11-01";
export const KICKOFF_END = "2026-11-08";
export const BEST_START = "2026-12-25";
export const BEST_END = "2026-12-31";

export const KINDS = ["currently_reading", "kickoff", "finished", "best"] as const;

export type Kind = (typeof KINDS)[number];

export type ScoreInput = {
  id: string;
  kind: Kind;
  title: string;
  borrowed: boolean;
  createdAt: string;
};

export type Score = {
  points: number;
  showJbn: boolean;
  notCounted: boolean;
  reason: string;
};

export const OUTSIDE_WINDOW =
  "An entry still saves if it falls outside its date window. It scores 0 until an organizer adds an adjustment.";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function utcDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function inWindow(iso: string, start: string, end: string): boolean {
  const day = utcDate(iso);
  return day >= start && day <= end;
}

export function formatUtc(iso: string): string {
  const date = new Date(iso);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}, ${hours}:${minutes} UTC`;
}

/** Case-insensitive, with trailing punctuation ignored. */
export function normalizeTitle(title: string): string {
  return title
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\p{P}\p{S}]+$/gu, "")
    .trim();
}

export function kindLabel(kind: Kind): string {
  switch (kind) {
    case "currently_reading":
      return "Currently reading";
    case "kickoff":
      return "Kick-off";
    case "finished":
      return "Finished";
    case "best":
      return "Best book";
  }
}

export function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value);
}

function byTime(a: ScoreInput, b: ScoreInput): number {
  const created = a.createdAt.localeCompare(b.createdAt);
  if (created !== 0) return created;
  return a.id.localeCompare(b.id);
}

function zero(reason: string, notCounted = false): Score {
  return { points: 0, showJbn: false, notCounted, reason };
}

export function scoreEntry(entry: ScoreInput, pairEntries: ScoreInput[]): Score {
  if (entry.kind === "currently_reading") {
    return zero("Say who is reading it. This scores 0 and shows on the public feed.");
  }

  if (entry.kind === "kickoff") {
    if (!inWindow(entry.createdAt, KICKOFF_START, KICKOFF_END)) return zero(OUTSIDE_WINDOW);
    const first = pairEntries
      .filter((item) => item.kind === "kickoff" && inWindow(item.createdAt, KICKOFF_START, KICKOFF_END))
      .sort(byTime)[0];
    if (first && first.id !== entry.id) {
      return zero("Kick-off already counted once for the pair.", true);
    }
    return {
      points: 2,
      showJbn: false,
      notCounted: false,
      reason: "Kick-off. 2 points, once per pair.",
    };
  }

  if (entry.kind === "best") {
    if (!inWindow(entry.createdAt, BEST_START, BEST_END)) return zero(OUTSIDE_WINDOW);
    const first = pairEntries
      .filter((item) => item.kind === "best" && inWindow(item.createdAt, BEST_START, BEST_END))
      .sort(byTime)[0];
    if (first && first.id !== entry.id) {
      return zero("Best book already counted once for the pair.", true);
    }
    return {
      points: 2,
      showJbn: false,
      notCounted: false,
      reason: "Best book. One recommendation per pair, worth 2 points.",
    };
  }

  if (!inWindow(entry.createdAt, SEASON_START, SEASON_END)) return zero(OUTSIDE_WINDOW);

  const key = normalizeTitle(entry.title);
  const first = pairEntries
    .filter(
      (item) =>
        item.kind === "finished" &&
        inWindow(item.createdAt, SEASON_START, SEASON_END) &&
        key.length > 0 &&
        normalizeTitle(item.title) === key,
    )
    .sort(byTime)[0];
  if (first && first.id !== entry.id) {
    return zero("This title already counted once for the pair.", true);
  }

  if (entry.borrowed) {
    return {
      points: 2,
      showJbn: true,
      notCounted: false,
      reason: "Finished book. A Jade Book Nest copy makes this title worth 2, counted once for the pair.",
    };
  }

  return {
    points: 1,
    showJbn: false,
    notCounted: false,
    reason: "Finished book. Worth 1 point, counted once for the pair.",
  };
}

export function readPoints(entries: ScoreInput[]): number {
  return entries.reduce((sum, entry) => sum + scoreEntry(entry, entries).points, 0);
}

export function pointsPhrase(total: number): string {
  return `${total} ${total === 1 ? "point" : "points"}`;
}

export function pairPointsLabel(read: number, adjusted: number): string {
  const total = read + adjusted;
  if (adjusted === 0) return pointsPhrase(total);
  const sign = adjusted > 0 ? `+${adjusted}` : String(adjusted);
  return `${pointsPhrase(total)} (${read} read, ${sign} adjusted)`;
}

export function adjustmentLine(points: number, note: string): string {
  const sign = points > 0 ? `+${points}` : String(points);
  return `${sign} organizer adjustment: ${note}`;
}

export function pairLabel(memberNames: string[], pendingPartnerName: string | null): string {
  const names = [...memberNames];
  if (pendingPartnerName && !names.some((name) => name.toLocaleLowerCase() === pendingPartnerName.toLocaleLowerCase())) {
    names.push(pendingPartnerName);
  }
  return names.join(" & ");
}
