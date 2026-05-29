import { AppNav } from "@/components/app-nav";
import { isSupabaseConfigured } from "@/lib/demo";

// Shell for signed-in product pages. The nav reflects real auth/tier state.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const demo = !isSupabaseConfigured();
  return (
    <div className="min-h-screen">
      <AppNav />
      {demo ? (
        <div className="bg-secondary/10 px-4 py-2 text-center text-sm text-secondary">
          Demo mode: running without a backend as a sample user. Award data is live from the mock
          provider. Connect Supabase to enable real accounts.
        </div>
      ) : null}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
