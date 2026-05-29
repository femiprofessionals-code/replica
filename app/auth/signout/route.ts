import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// POST /auth/signout — ends the session and returns to the landing page.
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
