import type { Score } from "@/lib/scoring";

export function PointsChips({ score }: { score: Score }) {
  return (
    <div className="chips">
      <span className={score.points > 0 ? "chip good" : "chip zero"}>{score.points} pt</span>
      {score.showJbn ? <span className="chip jbn">JBN borrow</span> : null}
      {score.notCounted ? <span className="not-counted">Not counted</span> : null}
    </div>
  );
}
