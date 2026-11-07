import { redirect } from "next/navigation";
import { AdjustmentForm } from "@/components/AdjustmentForm";
import { getCurrentUser } from "@/lib/auth";
import { loadPairViews } from "@/lib/board";
import { databaseConfigError } from "@/lib/config";
import { adjustmentLine } from "@/lib/scoring";

export default async function PairPage() {
  const problem = databaseConfigError();
  if (problem) {
    return (
      <main className="wrap">
        <h1>Pair</h1>
        <p className="form-error">{problem}</p>
      </main>
    );
  }
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const views = await loadPairViews();
  const visible = user.role === "organizer" ? views : views.filter((pair) => pair.id === user.pairId);

  return (
    <main className="wrap">
      <h1>Pair</h1>
      <p className="lede">
        {user.role === "organizer"
          ? "Every pair, with members, ages, and a place to add a points adjustment."
          : "Your pair, the people in it, and any organizer adjustments."}
      </p>
      {visible.length === 0 ? (
        <article className="card">
          <p>You are not in a pair yet. A partner can add your name when they create a pair, and you join the next time you sign in.</p>
        </article>
      ) : (
        <div className="pair-list">
          {visible.map((pair) => (
            <article className="card" key={pair.id}>
              <h2>{pair.label}</h2>
              <p className="hint">{pair.pointsLabel}</p>
              <ul className="member-list">
                {pair.members.map((member) => (
                  <li key={member.id}>
                    <strong>{member.name}</strong>
                    {member.age === null ? "" : ` · ${member.age}`}
                  </li>
                ))}
              </ul>
              {pair.pendingPartnerName ? (
                <p className="pending">Waiting for {pair.pendingPartnerName} to sign up or sign in.</p>
              ) : null}
              {pair.adjustments.length > 0 ? (
                <ul className="adj-list">
                  {pair.adjustments.map((item) => (
                    <li key={item.id}>{adjustmentLine(item.points, item.note)}</li>
                  ))}
                </ul>
              ) : null}
              {user.role === "organizer" ? <AdjustmentForm pairId={pair.id} /> : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
