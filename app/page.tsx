import Link from "next/link";

const rules = [
  {
    title: "Pairs only",
    body: "Points belong to a pair. One person creates the pair and enters a partner's name. The partner signs up or signs in with that name and accepts. One pair per person.",
  },
  {
    title: "Who you read with",
    body: "A friend, spouse, or family member, including a child above 10.",
  },
  {
    title: "What counts",
    body: "Books of all genres and formats. There is no cap of one book per week.",
  },
  {
    title: "Same book, once",
    body: "The same title on a pair counts once. A finished copy from the Jade Book Nest library is worth 2.",
  },
  {
    title: "JBN library worth more",
    body: "A finished book is 1 point, or 2 when it is from the Jade Book Nest library.",
  },
  {
    title: "Outside the window",
    body: "An entry still saves if it falls outside its date window. It scores 0 until an organizer adds an adjustment.",
  },
];

export default function HomePage() {
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <p className="eyebrow">Reading Challenge 2026</p>
          <h1>Jade Book Nest</h1>
          <p className="tagline">Share the joy. Read together.</p>
          <span className="date-pill">1 Nov – 31 Dec 2026</span>
        </div>
        <article className="card spirit">
          <h2>The spirit</h2>
          <p>Participation, curiosity, and consistency. Read what you love, tell your pair about it, and keep going through the season.</p>
          <Link className="button" href="/dashboard">
            See the boards
          </Link>
        </article>
      </section>

      <h2 className="section-title">Rules</h2>
      <div className="rules">
        {rules.map((rule) => (
          <article className="card" key={rule.title}>
            <h3>{rule.title}</h3>
            <p>{rule.body}</p>
          </article>
        ))}
      </div>

      <article className="card how">
        <h2>How points work</h2>
        <div className="point-row">
          <span className="point-badge two">2</span>
          <div>
            <div className="point-title">First entry</div>
            <p>The first entry a pair saves is worth 2 points, once. Later entries follow the rules below.</p>
          </div>
        </div>
        <div className="point-row">
          <span className="point-badge zero">0</span>
          <div>
            <div className="point-title">Currently reading</div>
            <p>Title and who is reading it. It shows on the feed and scores nothing.</p>
          </div>
        </div>
        <div className="point-row">
          <span className="point-badge two">2</span>
          <div>
            <div className="point-title">Kick-off, 1–8 Nov 2026</div>
            <p>An intro plus the books you are starting. 2 points, once per pair.</p>
          </div>
        </div>
        <div className="point-row">
          <span className="point-badge one">1</span>
          <div>
            <div className="point-title">Finished book</div>
            <p>A 2–5 line review. 2 points instead of 1 when the copy is from the Jade Book Nest library.</p>
          </div>
        </div>
        <div className="point-row">
          <span className="point-badge two">2</span>
          <div>
            <div className="point-title">Best book, 25–31 Dec 2026</div>
            <p>One recommendation per pair, worth 2 points.</p>
          </div>
        </div>
        <p className="fine">Date windows use UTC. The dashboard total includes organizer adjustments.</p>
      </article>
    </main>
  );
}
