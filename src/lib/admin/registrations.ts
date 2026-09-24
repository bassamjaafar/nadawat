import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RegistrationStatus } from "@/lib/admin/registration-status";

export type AdminRegistrationRow = {
  id: string;
  full_name: string | null;
  // Pre-"شارك في الحوار" rows only had these; full_name was backfilled.
  first_name: string | null;
  last_name: string | null;
  email: string;
  country: string;
  phone: string | null;
  participation_type: "written" | "live" | null;
  question: string | null;
  ack_limited_selection: boolean;
  ack_time_limit: boolean;
  consent_recording_at: string | null;
  status: RegistrationStatus;
  admin_note: string | null;
  notify_future_events: boolean;
  created_at: string;
  debate: { title_ar: string; slug: string } | null;
};

export function registrantName(r: AdminRegistrationRow): string {
  return (
    r.full_name?.trim() ||
    [r.first_name, r.last_name].filter(Boolean).join(" ") ||
    "—"
  );
}

export async function adminListRegistrations(): Promise<AdminRegistrationRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      `id, full_name, first_name, last_name, email, country, phone,
       participation_type, question, ack_limited_selection, ack_time_limit,
       consent_recording_at, status, admin_note, notify_future_events,
       created_at, debate:debates ( title_ar, slug )`,
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as unknown as AdminRegistrationRow[];
}

/** Through the admin's own session — RLS allows admins to update rows. */
export async function adminUpdateRegistration(
  id: string,
  input: { status: RegistrationStatus; admin_note: string | null },
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("registrations")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}
