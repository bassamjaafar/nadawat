import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminSubscriberRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  status: "pending" | "confirmed" | "unsubscribed";
  created_at: string;
  confirmed_at: string | null;
};

export async function adminListSubscribers(): Promise<AdminSubscriberRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscribers")
    .select(
      "id, first_name, last_name, email, country, status, created_at, confirmed_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
