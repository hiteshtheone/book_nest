import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { databaseConfigError } from "@/lib/config";

export default async function SignUpPage() {
  const problem = databaseConfigError();
  if (!problem && (await getCurrentUser())) redirect("/dashboard");
  return (
    <main className="wrap">
      <h1>Sign up</h1>
      <p className="lede">A name and a password. Then create a pair, or join the one waiting for you.</p>
      <article className="card auth-card">
        {problem ? <p className="form-error">{problem}</p> : null}
        <SignUpForm />
      </article>
    </main>
  );
}
