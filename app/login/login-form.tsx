"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Button, Input, Field } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Client component: initiates magic-link and Google OAuth. No secrets here;
// the browser client only uses the public anon key.
export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const supabase = createSupabaseBrowserClient();

  const redirectTo = () => {
    const url = new URL("/auth/callback", window.location.origin);
    if (next) url.searchParams.set("next", next);
    return url.toString();
  };

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    setStatus(error ? "error" : "sent");
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <Mail className="mx-auto size-8 text-secondary" aria-hidden />
        <p className="mt-3 font-semibold text-primary">Check your inbox</p>
        <p className="mt-1 text-sm text-muted">
          We sent a sign in link to <span className="font-medium text-text">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={signInWithGoogle}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-text transition hover:bg-background cursor-pointer"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={sendMagicLink} className="flex flex-col gap-3">
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending link..." : "Email me a magic link"}
        </Button>
        {status === "error" ? (
          <p className="text-sm text-warning">Could not send the link. Check the address and try again.</p>
        ) : null}
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.45.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
