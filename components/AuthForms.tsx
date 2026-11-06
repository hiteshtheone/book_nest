"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type ActionState } from "@/app/actions";

const initial: ActionState = { error: "" };

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action}>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <label className="field">
        <span>Name</span>
        <input name="name" autoComplete="username" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="button wide" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="hint">
        Need a pair? <Link href="/sign-up">Sign up</Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, initial);
  const [mode, setMode] = useState<"create" | "join">("create");
  return (
    <form action={action}>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <label className="field">
        <span>Name</span>
        <input name="name" autoComplete="username" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="new-password" required />
      </label>
      <label className="field">
        <span>Age</span>
        <input name="age" type="number" min={1} max={120} inputMode="numeric" required />
      </label>
      <fieldset className="choice">
        <legend className="point-title">Pair</legend>
        <label>
          <input type="radio" name="mode" value="create" checked={mode === "create"} onChange={() => setMode("create")} />
          Create a pair
        </label>
        <label>
          <input type="radio" name="mode" value="join" checked={mode === "join"} onChange={() => setMode("join")} />
          Join a pair
        </label>
      </fieldset>
      {mode === "create" ? (
        <label className="field">
          <span>Partner&apos;s name</span>
          <input name="partner" autoComplete="off" required />
        </label>
      ) : (
        <p className="hint">Use the name your partner entered when they created the pair. One pair per person.</p>
      )}
      {mode === "create" ? <p className="hint">Your partner accepts by signing up or signing in with that name.</p> : null}
      <button className="button wide" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Sign up"}
      </button>
      <p className="hint">
        Already registered? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  );
}
