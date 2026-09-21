import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Person } from "@/lib/types";
import type { PersonInput } from "@/lib/admin/validation";

const PHOTO_BUCKET = "people-photos";

export async function adminListPeople(): Promise<Person[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name_ar, title_ar, bio_ar, image_url, slug")
    .order("name_ar", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminGetPerson(id: string): Promise<Person | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("people")
    .select("id, name_ar, title_ar, bio_ar, image_url, slug")
    .eq("id", id)
    .maybeSingle();
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

export async function adminUpdatePerson(
  id: string,
  input: PersonInput,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("people")
    .update({
      name_ar: input.name_ar,
      title_ar: input.title_ar ?? null,
      bio_ar: input.bio_ar ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function adminDeletePerson(id: string): Promise<void> {
  const supabase = await getSupabaseServerClient();

  // debates.moderator_id is ON DELETE SET NULL, not RESTRICT — the database
  // alone would silently null out a real event's moderator instead of
  // blocking the delete. Check explicitly rather than relying on the FK.
  const { data: asModerator, error: modErr } = await supabase
    .from("debates")
    .select("title_ar")
    .eq("moderator_id", id)
    .limit(1)
    .maybeSingle();
  if (modErr) throw new Error(modErr.message);
  if (asModerator) {
    throw new Error(
      `لا يمكن حذف هذا الشخص لأنّه محاور ندوة «${asModerator.title_ar}». عدّل المحاور من صفحة الندوة أولًا.`,
    );
  }

  const { error } = await supabase.from("people").delete().eq("id", id);
  if (error) {
    // debate_participants.person_id IS restrict — this is the speaker case.
    if (error.code === "23503") {
      throw new Error(
        "لا يمكن حذف هذا الشخص لأنّه لا يزال ضيفًا في ندوة واحدة على الأقل.",
      );
    }
    throw new Error(error.message);
  }
}

/**
 * Storage writes use the service-role client rather than the admin's own
 * RLS-bound session — unlike every table write elsewhere in admin/, which
 * deliberately goes through RLS. There's no SQL access available to this
 * project to define storage.objects RLS policies (no direct Postgres
 * connection, only the JS client), so the admin check here is the only
 * enforcement layer: callers MUST verify the caller is an admin themselves
 * before calling this. The bucket itself is public-read (set at creation),
 * so no policy is needed for the site to display the photos.
 */
export async function adminUploadPersonPhoto(
  personId: string,
  file: File,
): Promise<string> {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${personId}-${Date.now()}.${ext}`;

  const admin = getSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  // Best-effort cleanup of the old photo — a failure here shouldn't block
  // the new photo from being saved.
  const existing = await adminGetPerson(personId);
  const oldPath = existing?.image_url?.includes(`/${PHOTO_BUCKET}/`)
    ? existing.image_url.split(`/${PHOTO_BUCKET}/`)[1]
    : null;

  const supabase = await getSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("people")
    .update({ image_url: publicUrl })
    .eq("id", personId);
  if (updateError) throw new Error(updateError.message);

  if (oldPath) {
    await admin.storage.from(PHOTO_BUCKET).remove([oldPath]).catch(() => {});
  }

  return publicUrl;
}
