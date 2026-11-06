import { redirect } from "next/navigation";
import { SignInForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="wrap">
      <h1>Sign in</h1>
      <p className="lede">Use your name and password.</p>
      <article className="card auth-card">
        <SignInForm />
      </article>
    </main>
  );
}
