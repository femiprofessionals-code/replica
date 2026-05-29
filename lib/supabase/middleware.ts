import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/demo";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Refreshes the Supabase auth session on every request and keeps cookies in
// sync. Also guards private routes: unauthenticated users hitting an app route
// are redirected to /login.
const PUBLIC_PREFIXES = ["/login", "/auth", "/points-101", "/_next", "/favicon"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Demo mode: no Supabase configured, so skip auth entirely and let every
  // route render as the demo user. Keeps the frontend previewable with no backend.
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = path === "/" || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}
