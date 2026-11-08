import { nameWithAge } from "./names";
import {
  listAdjustments,
  listEntries,
  listPairs,
  listUsers,
  membersOf,
  readerMatchesMember,
  type Adjustment,
  type Entry,
  type User,
} from "./store";
import {
  adjustmentLine,
  pairLabel,
  pairPointsLabel,
  pointsPhrase,
  readPoints,
  scoreEntry,
  type Score,
  type ScoreInput,
} from "./scoring";

export type ScoredEntry = Entry & { score: Score; pairName: string; readerAge: number | null };

export type Standing = {
  id: string;
  label: string;
  read: number;
  adjusted: number;
  total: number;
  pointsLabel: string;
  notes: string[];
};

export type JuniorStanding = {
  id: string;
  name: string;
  age: number;
  pairName: string;
  points: number;
  pointsLabel: string;
};

export type Board = {
  readingNow: ScoredEntry[];
  finished: ScoredEntry[];
  pairs: Standing[];
  juniors: JuniorStanding[];
};

function toScoreInput(entry: Entry): ScoreInput {
  return {
    id: entry.id,
    kind: entry.kind,
    title: entry.title,
    borrowed: entry.borrowed,
    createdAt: entry.createdAt,
  };
}

export async function loadBoard(): Promise<Board> {
  const [pairs, users, entries, adjustments] = await Promise.all([
    listPairs(),
    listUsers(),
    listEntries(),
    listAdjustments(),
  ]);

  const nameByPair = new Map<string, string>();
  for (const pair of pairs) {
    const members = membersOf(users, pair.id);
    nameByPair.set(
      pair.id,
      pairLabel(members.map((member) => nameWithAge(member.name, member.age)), pair.pendingPartnerName),
    );
  }

  const scored: ScoredEntry[] = entries.map((entry) => {
    const pairEntries = entries.filter((item) => item.pairId === entry.pairId).map(toScoreInput);
    const reader = readerMatchesMember(membersOf(users, entry.pairId), entry.readerName);
    return {
      ...entry,
      score: scoreEntry(toScoreInput(entry), pairEntries),
      pairName: nameByPair.get(entry.pairId) ?? "Pair",
      readerAge: reader?.age ?? null,
    };
  });

  const readingNow = [...scored]
    .filter((entry) => entry.kind === "currently_reading")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .filter((entry, index, list) => list.findIndex((item) => item.pairId === entry.pairId) === index);

  const finished = scored
    .filter((entry) => entry.kind === "finished")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

  const standings: Standing[] = pairs.map((pair) => {
    const pairEntries = entries.filter((entry) => entry.pairId === pair.id).map(toScoreInput);
    const read = readPoints(pairEntries);
    const notes = adjustments.filter((item) => item.pairId === pair.id);
    const adjusted = notes.reduce((sum, item) => sum + item.points, 0);
    return {
      id: pair.id,
      label: nameByPair.get(pair.id) ?? "Pair",
      read,
      adjusted,
      total: read + adjusted,
      pointsLabel: pairPointsLabel(read, adjusted),
      notes: notes.map((item) => adjustmentLine(item.points, item.note)),
    };
  });
  standings.sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));

  const juniors: JuniorStanding[] = users
    .filter((user) => user.pairId && user.age !== null && user.age >= 10 && user.age <= 18)
    .map((user) => {
      const authored = entries.filter((entry) => entry.authorId === user.id).map(toScoreInput);
      const pairEntries = entries.filter((entry) => entry.pairId === user.pairId).map(toScoreInput);
      const points = authored.reduce((sum, entry) => sum + scoreEntry(entry, pairEntries).points, 0);
      return {
        id: user.id,
        name: user.name,
        age: user.age as number,
        pairName: nameByPair.get(user.pairId as string) ?? "Pair",
        points,
        pointsLabel: pointsPhrase(points),
      };
    });
  juniors.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return { readingNow, finished, pairs: standings, juniors };
}

export type PairView = {
  id: string;
  label: string;
  pendingPartnerName: string | null;
  members: User[];
  adjustments: Adjustment[];
  read: number;
  adjusted: number;
  pointsLabel: string;
};

export async function loadPairViews(): Promise<PairView[]> {
  const [pairs, users, entries, adjustments] = await Promise.all([
    listPairs(),
    listUsers(),
    listEntries(),
    listAdjustments(),
  ]);
  return pairs.map((pair) => {
    const members = membersOf(users, pair.id);
    const pairEntries = entries.filter((entry) => entry.pairId === pair.id).map(toScoreInput);
    const pairAdjustments = adjustments.filter((item) => item.pairId === pair.id);
    const read = readPoints(pairEntries);
    const adjusted = pairAdjustments.reduce((sum, item) => sum + item.points, 0);
    return {
      id: pair.id,
      label: pairLabel(members.map((member) => nameWithAge(member.name, member.age)), pair.pendingPartnerName),
      pendingPartnerName: pair.pendingPartnerName,
      members,
      adjustments: pairAdjustments,
      read,
      adjusted,
      pointsLabel: pairPointsLabel(read, adjusted),
    };
  });
}
