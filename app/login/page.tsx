import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · ClearPoints" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  const user = await getUser();
  if (user) redirect(next ?? "/search");

  return (
    <main className="aurora min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
        <Link href="/" className="mb-8 flex items-center gap-2 font-semibold text-primary">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-white">
            CP
          </span>
          <span className="font-[family-name:var(--font-sora)] text-lg">ClearPoints</span>
        </Link>
        <h1 className="text-3xl font-bold text-primary">Sign in</h1>
        <p className="mt-2 text-muted">
          Use a magic link or your Google account. We will set up your travel profile next.
        </p>

        {error ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-warning">
            That sign in link did not work. Please request a new one.
          </p>
        ) : null}

        <div className="mt-6">
          <LoginForm next={next} />
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          By continuing you agree to our terms. We never post or share without your say so.
        </p>
      </div>
    </main>
  );
}
