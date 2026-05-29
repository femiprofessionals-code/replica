import Link from "next/link";
import { Compass, Search, User, BookOpen, LogOut } from "lucide-react";
import { Badge } from "@/components/ui";
import { getProfile, isPremium } from "@/lib/auth";

const LINKS = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/explorer", label: "Top Deals", icon: Compass },
  { href: "/points-101", label: "Points 101", icon: BookOpen },
  { href: "/account", label: "Account", icon: User },
];

// Top navigation. Server component so it can reflect the real auth/tier state.
export async function AppNav() {
  const profile = await getProfile();
  const signedIn = !!profile;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-sm font-bold text-white">
            CP
          </span>
          <span className="font-[family-name:var(--font-sora)] text-lg">ClearPoints</span>
        </Link>

        {signedIn ? (
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-primary"
                >
                  <l.icon className="size-4" aria-hidden />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Link href="/points-101" className="text-sm font-medium text-muted hover:text-primary">
            How it works
          </Link>
        )}

        <div className="flex items-center gap-3">
          {signedIn ? (
            <>
              <Badge tone={isPremium(profile) ? "gold" : "neutral"}>
                {isPremium(profile) ? "Premium" : "Free"}
              </Badge>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-primary cursor-pointer"
                >
                  <LogOut className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
