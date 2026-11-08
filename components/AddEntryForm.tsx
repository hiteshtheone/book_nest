"use client";

import { useActionState, useEffect, useState } from "react";
import { addEntry, type ActionState } from "@/app/actions";

const hints = {
  currently_reading: "Say who is reading it. After the pair’s first entry, this scores 0 and shows on the public feed.",
  finished: "A 2–5 line review. 1 point, or 2 when it is from the Jade Book Nest library.",
} as const;

type LogKind = keyof typeof hints;

const initial: ActionState = { error: "" };

export function AddEntryForm({ defaultWho }: { defaultWho: string }) {
  const [state, action, pending] = useActionState(addEntry, initial);
  const [kind, setKind] = useState<LogKind>("currently_reading");

  useEffect(() => {
    if (state.ok) setKind("currently_reading");
  }, [state]);

  return (
    <form action={action}>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <label className="field">
        <span>Kind</span>
        <select
          name="kind"
          value={kind}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "currently_reading" || next === "finished") setKind(next);
          }}
        >
          <option value="currently_reading">Currently reading</option>
          <option value="finished">Finished Book</option>
        </select>
      </label>
      <label className="field">
        <span>Title</span>
        <textarea name="title" rows={3} placeholder="Book title" required />
      </label>
      <label className="field">
        <span>Who</span>
        <input name="who" defaultValue={defaultWho} autoComplete="off" required />
      </label>
      {kind === "finished" ? (
        <label className="field">
          <span>Review</span>
          <textarea name="body" rows={4} required />
        </label>
      ) : null}
      <label className="check">
        <input type="checkbox" name="borrowed" />
        <span>From the Jade Book Nest library</span>
      </label>
      <p className="hint">The first entry a pair saves is worth 2 points, once. {hints[kind]}</p>
      <button className="button wide" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}
