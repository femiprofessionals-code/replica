"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/demo";
import { AIRPORTS } from "@/lib/award-data/catalog";
import { POINTS_PROGRAMS } from "@/lib/reference-data";
import { CABINS } from "@/lib/types";

const VALID_AIRPORTS = AIRPORTS.map((a) => a.iata);
const VALID_PROGRAMS = POINTS_PROGRAMS.map((p) => p.code);

const schema = z.object({
  home_airports: z.array(z.enum(VALID_AIRPORTS as [string, ...string[]])).min(1).max(10),
  points_programs: z.array(z.enum(VALID_PROGRAMS as [string, ...string[]])).max(10),
  cabin_pref: z.enum(CABINS as [string, ...string[]]),
});

export type AccountState = { error?: string; saved?: boolean };

// Server action: updates the user's travel profile. Validated server-side.
export async function updateAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const parsed = schema.safeParse({
    home_airports: formData.getAll("home_airports"),
    points_programs: formData.getAll("points_programs"),
    cabin_pref: formData.get("cabin_pref"),
  });

  if (!parsed.success) {
    return { error: "Keep at least one home airport and a cabin preference." };
  }

  // Demo mode: no backend to write to, report success without persisting.
  if (!isSupabaseConfigured()) return { saved: true };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("users_profile")
    .update({
      home_airports: parsed.data.home_airports,
      points_programs: parsed.data.points_programs,
      cabin_pref: parsed.data.cabin_pref,
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save changes. Please try again." };

  revalidatePath("/account");
  return { saved: true };
}
