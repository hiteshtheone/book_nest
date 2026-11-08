import { redirect } from "next/navigation";
import { AddEntryForm } from "@/components/AddEntryForm";
import { PointsChips } from "@/components/PointsChips";
import { removeEntry } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { loadPairViews } from "@/lib/board";
import { nameWithAge, sameName } from "@/lib/names";
import { formatUtc, kindLabel, scoreEntry } from "@/lib/scoring";
import { databaseProblem } from "@/lib/db";
import { listEntries } from "@/lib/store";

export default async function ReadingLogPage() {
  const problem = await databaseProblem();
  if (problem) {
    return (
      <main className="wrap">
        <h1>Reading log</h1>
        <p className="form-error">{problem}</p>
      </main>
    );
  }
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const views = await loadPairViews();
  const pair = views.find((item) => item.id === user.pairId);
  const entries = pair ? (await listEntries()).filter((entry) => entry.pairId === pair.id) : [];
  const scored = entries
    .map((entry) => ({ ...entry, score: scoreEntry(entry, entries) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));

  return (
    <main className="wrap">
      <h1>Reading log</h1>
      {!pair ? (
        <article className="card">
          <p>Reading log is for people in a pair. Create or join a pair when you sign up.</p>
        </article>
      ) : (
        <div className="log">
          <article className="card">
            <h2>Add an entry</h2>
            <AddEntryForm defaultWho={user.name} />
          </article>
          <div className="stack">
            <article className="card">
              <h2 className="points-total">{pair.pointsLabel}</h2>
              <p className="hint">
                The first entry a pair saves is worth 2 points, once. After that, a finished book is 1 point, or 2 from the Jade Book Nest library. The same title counts once. Entries outside a window stay in the log and score 0.
              </p>
            </article>
            {scored.length === 0 ? <p className="empty">No entries yet.</p> : null}
            {scored.map((entry) => (
              <article className="card feed-card" key={entry.id}>
                <p className="meta">
                  {kindLabel(entry.kind)} · {formatUtc(entry.createdAt)}
                </p>
                <h3>{entry.title}</h3>
                {entry.kind !== "currently_reading" && entry.body ? <p className="review">{entry.body}</p> : null}
                <p className="who-line">
                  {nameWithAge(entry.readerName, pair.members.find((member) => sameName(member.name, entry.readerName))?.age)}
                </p>
                <PointsChips score={entry.score} />
                <p className="reason">{entry.score.reason}</p>
                <form action={removeEntry}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button className="remove" type="submit">
                    Remove
                  </button>
                </form>
              </article>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
