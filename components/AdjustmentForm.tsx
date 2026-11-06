"use client";

import { useActionState } from "react";
import { addAdjustment, type ActionState } from "@/app/actions";

const initial: ActionState = { error: "" };

export function AdjustmentForm({ pairId }: { pairId: string }) {
  const [state, action, pending] = useActionState(addAdjustment, initial);
  return (
    <form action={action} className="adjust-form">
      <input type="hidden" name="pairId" value={pairId} />
      <label className="field">
        <span>Points</span>
        <input name="points" type="number" step={1} required placeholder="1" />
      </label>
      <label className="field">
        <span>Note</span>
        <input name="note" type="text" required placeholder="Welcome bonus" />
      </label>
      <button className="button" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add adjustment"}
      </button>
      {state.error ? <p className="form-error" style={{ gridColumn: "1 / -1" }}>{state.error}</p> : null}
    </form>
  );
}
