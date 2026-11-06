"use client";

import { useActionState, useState } from "react";
import { addEntry, type ActionState } from "@/app/actions";
import type { Kind } from "@/lib/scoring";

const hints: Record<Kind, string> = {
  currently_reading: "Say who is reading it. This scores 0 and shows on the public feed.",
  kickoff: "An intro plus the books you are starting. 2 points, once per pair, 1–8 Nov 2026 (UTC).",
  finished: "A 2–5 line review. 1 point, or 2 when the copy was borrowed from Jade Book Nest.",
  best: "One recommendation per pair, worth 2 points, 25–31 Dec 2026 (UTC).",
};

const initial: ActionState = { error: "" };

export function AddEntryForm({ defaultWho }: { defaultWho: string }) {
  const [state, action, pending] = useActionState(addEntry, initial);
  const [kind, setKind] = useState<Kind>("currently_reading");

  return (
    <form action={action}>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <label className="field">
        <span>Kind</span>
        <select name="kind" value={kind} onChange={(event) => setKind(event.target.value as Kind)}>
          <option value="currently_reading">Currently reading</option>
          <option value="kickoff">Kick-off</option>
          <option value="finished">Finished book</option>
          <option value="best">Best book</option>
        </select>
      </label>
      <label className="field">
        <span>Title or starting books</span>
        <textarea name="title" rows={3} placeholder="Book title" required />
      </label>
      <label className="field">
        <span>Who</span>
        <input name="who" defaultValue={defaultWho} autoComplete="off" required />
      </label>
      <label className="field">
        <span>Words</span>
        <textarea name="body" className="words" rows={4} required={kind !== "currently_reading"} />
      </label>
      {kind === "finished" ? (
        <label className="check">
          <input type="checkbox" name="borrowed" />
          <span>Borrowed from Jade Book Nest</span>
        </label>
      ) : null}
      <p className="hint">{hints[kind]}</p>
      <button className="button wide" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
