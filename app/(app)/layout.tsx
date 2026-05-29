import { AppNav } from "@/components/app-nav";

// Shell for signed-in product pages. The nav reflects real auth/tier state.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
