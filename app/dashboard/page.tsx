import { PointsChips } from "@/components/PointsChips";
import { loadBoard } from "@/lib/board";
import { databaseProblem } from "@/lib/db";
import { nameWithAge } from "@/lib/names";
import { formatUtc } from "@/lib/scoring";

export default async function DashboardPage() {
  const problem = await databaseProblem();
  if (problem) {
    return (
      <main className="wrap">
        <h1>Dashboard</h1>
        <p className="form-error">{problem}</p>
      </main>
    );
  }
  const board = await loadBoard();

  return (
    <main className="wrap">
      <h1>Dashboard</h1>
      <p className="lede">What pairs are reading, the reviews they finished, and the standings.</p>
      <div className="board">
        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            Reading now
          </h2>
          <div className="stack">
            {board.readingNow.length === 0 ? <p className="empty">No one has logged a current book yet.</p> : null}
            {board.readingNow.map((entry) => (
              <article className="card feed-card" key={entry.id}>
                <p className="meta">
                  {entry.pairName} · {formatUtc(entry.createdAt)}
                </p>
                <h3>{entry.title}</h3>
                <p>Being read by {nameWithAge(entry.readerName, entry.readerAge)}</p>
              </article>
            ))}
          </div>

          <h2 className="section-title">Finished-book reviews</h2>
          <div className="stack">
            {board.finished.length === 0 ? <p className="empty">No finished-book reviews yet.</p> : null}
            {board.finished.map((entry) => (
              <article className="card feed-card" key={entry.id}>
                <p className="meta">
                  {entry.pairName} · {nameWithAge(entry.readerName, entry.readerAge)} · {formatUtc(entry.createdAt)}
                </p>
                <h3>{entry.title}</h3>
                {entry.body ? <p className="review">{entry.body}</p> : null}
                <PointsChips score={entry.score} />
                <p className="reason">{entry.score.reason}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="stack">
          <article className="card side-card">
            <h2>JBN Dynamic Duo</h2>
            <p className="intro">Pair standings, including organizer adjustments.</p>
            <ol className="ranks">
              {board.pairs.length === 0 ? <li className="empty">No pairs yet.</li> : null}
              {board.pairs.map((pair, index) => (
                <li key={pair.id}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <div className="rank-name">{pair.label}</div>
                    <div className="rank-points">{pair.pointsLabel}</div>
                    {pair.notes.map((note) => (
                      <div className="rank-note" key={note}>
                        {note}
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </article>
          <article className="card side-card">
            <h2>Junior Bookworm</h2>
            <p className="intro">Ages 10–18, personal points.</p>
            <ol className="ranks">
              {board.juniors.length === 0 ? <li className="empty">No juniors in a pair yet.</li> : null}
              {board.juniors.map((junior, index) => (
                <li key={junior.id}>
                  <span className="rank">{index + 1}</span>
                  <div>
                    <div className="rank-name">
                      {nameWithAge(junior.name, junior.age)}
                    </div>
                    <div className="rank-sub">{junior.pairName}</div>
                    <div className="rank-points">{junior.pointsLabel}</div>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </aside>
      </div>
    </main>
  );
}
