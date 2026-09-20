import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/types";
import type { PersonInput } from "@/lib/admin/validation";

export async function adminListPeople(): Promise<Person[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name_ar, title_ar, bio_ar, image_url, slug")
    .order("name_ar", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminCreatePerson(input: PersonInput): Promise<Person> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .insert({
      name_ar: input.name_ar,
      title_ar: input.title_ar ?? null,
      bio_ar: input.bio_ar ?? null,
    })
    .select("id, name_ar, title_ar, bio_ar, image_url, slug")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
