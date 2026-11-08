import { redirect } from "next/navigation";
import { SignInForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { databaseProblem } from "@/lib/db";

export default async function SignInPage() {
  const problem = await databaseProblem();
  if (!problem && (await getCurrentUser())) redirect("/dashboard");
  return (
    <main className="wrap">
      <h1>Sign in</h1>
      <p className="lede">Use your name and password.</p>
      <article className="card auth-card">
        {problem ? <p className="form-error">{problem}</p> : null}
        <SignInForm />
      </article>
    </main>
  );
}
