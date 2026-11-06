import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export default async function SignUpPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <main className="wrap">
      <h1>Sign up</h1>
      <p className="lede">A name and a password. Then create a pair, or join the one waiting for you.</p>
      <article className="card auth-card">
        <SignUpForm />
      </article>
    </main>
  );
}
