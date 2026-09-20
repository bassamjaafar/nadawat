import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRegistrationRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  notify_future_events: boolean;
  created_at: string;
  debate: { title_ar: string; slug: string } | null;
};

export async function adminListRegistrations(): Promise<AdminRegistrationRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, first_name, last_name, email, country, notify_future_events, created_at, debate:debates ( title_ar, slug )",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as AdminRegistrationRow[];
}
