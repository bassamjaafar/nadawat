import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { orderSections, sortMembers } from "@/lib/data/about";
import type { AboutSection, AboutSectionKey } from "@/lib/about/content";
import {
  compareArabicNames,
  type GroupStatus,
  type Membership,
  type MemberStatus,
  type TeamGroup,
  type TeamMember,
} from "@/lib/about/team";
import type { GroupInput, MemberInput, SectionInput } from "@/lib/admin/about-validation";

// Every read and write here goes through the signed-in admin's own session,
// so the database's RLS (is_admin()) is what allows it — the same approach
// as the events editor. The one exception is the photo file itself (see
// adminUploadMemberPhoto).

const PHOTO_BUCKET = "people-photos";
const SECTION_COLUMNS = "key, title_ar, body_ar, link_label_ar, link_url, is_published";
const GROUP_COLUMNS = "id, name_ar, description_ar, sort_order, status";
const MEMBER_COLUMNS =
  "id, full_name_ar, title_ar, bio_ar, image_url, status, consent_given, consent_recorded_at, " +
  "memberships:team_memberships ( group_id, start_date, end_date )";

// --- sections --------------------------------------------------------------

export async function adminListSections(): Promise<AboutSection[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("about_sections").select(SECTION_COLUMNS);
  if (error) throw new Error(error.message);
  return orderSections(data as AboutSection[]);
}

export async function adminGetSection(key: AboutSectionKey): Promise<AboutSection | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("about_sections")
    .select(SECTION_COLUMNS)
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as AboutSection | null;
}

export async function adminUpdateSection(key: AboutSectionKey, input: SectionInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("about_sections")
    .update({
      title_ar: input.title_ar,
      body_ar: input.body_ar ?? "",
      link_label_ar: key === "join" ? (input.link_label_ar ?? null) : null,
      link_url: key === "join" ? (input.link_url ?? null) : null,
      is_published: input.is_published,
    })
    .eq("key", key)
    .select("key");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("تعذّر حفظ القسم.");
}

// --- groups ----------------------------------------------------------------

export type GroupWithCounts = TeamGroup & { published: number; total: number };

export async function adminListGroups(): Promise<GroupWithCounts[]> {
  const supabase = await getSupabaseServerClient();
  const [{ data: groups, error }, { data: links, error: linkErr }] = await Promise.all([
    supabase.from("team_groups").select(GROUP_COLUMNS),
    supabase.from("team_memberships").select("group_id, member:team_members ( status )"),
  ]);
  if (error) throw new Error(error.message);
  if (linkErr) throw new Error(linkErr.message);

  const counts = new Map<string, { published: number; total: number }>();
  for (const l of (links ?? []) as unknown as { group_id: string; member: { status: MemberStatus } | null }[]) {
    if (!l.member || l.member.status === "archived") continue;
    const c = counts.get(l.group_id) ?? { published: 0, total: 0 };
    c.total += 1;
    if (l.member.status === "published") c.published += 1;
    counts.set(l.group_id, c);
  }

  return (groups as TeamGroup[])
    .map((g) => ({ ...g, ...(counts.get(g.id) ?? { published: 0, total: 0 }) }))
    .sort((a, b) => a.sort_order - b.sort_order || compareArabicNames(a.name_ar, b.name_ar));
}

export async function adminGetGroup(id: string): Promise<TeamGroup | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_groups")
    .select(GROUP_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as TeamGroup | null;
}

function groupRow(input: GroupInput) {
  return {
    name_ar: input.name_ar,
    description_ar: input.description_ar ?? "",
    sort_order: input.sort_order,
    status: input.status as GroupStatus,
  };
}

export async function adminCreateGroup(input: GroupInput): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_groups")
    .insert(groupRow(input))
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function adminUpdateGroup(id: string, input: GroupInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("team_groups").update(groupRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

// --- members ---------------------------------------------------------------

type MemberRow = Omit<TeamMember, "memberships"> & { memberships: Membership[] | null };

function toMember(row: MemberRow): TeamMember {
  return { ...row, memberships: row.memberships ?? [] };
}

export async function adminListMembers(): Promise<TeamMember[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from("team_members").select(MEMBER_COLUMNS);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as MemberRow[])
    .map(toMember)
    .sort((a, b) => compareArabicNames(a.full_name_ar, b.full_name_ar));
}

export async function adminGetMember(id: string): Promise<TeamMember | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(MEMBER_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toMember(data as unknown as MemberRow) : null;
}

function memberRow(input: MemberInput) {
  return {
    full_name_ar: input.full_name_ar,
    title_ar: input.title_ar ?? "",
    bio_ar: input.bio_ar ?? "",
    consent_given: input.consent_given,
    status: input.status as MemberStatus,
  };
}

async function saveMemberships(memberId: string, memberships: Membership[]): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const keep = memberships.map((m) => m.group_id);

  let del = supabase.from("team_memberships").delete().eq("member_id", memberId);
  if (keep.length) del = del.not("group_id", "in", `(${keep.join(",")})`);
  const { error: delErr } = await del;
  if (delErr) throw new Error(delErr.message);

  if (memberships.length) {
    const { error } = await supabase.from("team_memberships").upsert(
      memberships.map((m) => ({
        member_id: memberId,
        group_id: m.group_id,
        start_date: m.start_date,
        end_date: m.end_date,
      })),
      { onConflict: "member_id,group_id" },
    );
    if (error) throw new Error(error.message);
  }
}

export async function adminCreateMember(input: MemberInput): Promise<string> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("team_members")
    .insert(memberRow(input))
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await saveMemberships(data.id as string, input.memberships);
  return data.id as string;
}

export async function adminUpdateMember(id: string, input: MemberInput): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("team_members").update(memberRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  await saveMemberships(id, input.memberships);
}

/**
 * The photo file goes into the same public storage bucket as guests'
 * photos, under team/, through the service-role client — there are no
 * storage policies on this project (see adminUploadPersonPhoto). Callers
 * MUST check the caller is an admin first. The profile's image_url itself is
 * saved through the admin's own session, so RLS still applies there.
 */
export async function adminUploadMemberPhoto(memberId: string, file: File): Promise<string> {
  const existing = await adminGetMember(memberId);
  if (!existing) throw new Error("not found");

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `team/${memberId}-${Date.now()}.${ext}`;

  const admin = getSupabaseAdminClient();
  const { error: uploadError } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = admin.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("team_members")
    .update({ image_url: publicUrl })
    .eq("id", memberId);
  if (error) {
    await admin.storage.from(PHOTO_BUCKET).remove([path]).catch(() => {});
    throw new Error(error.message);
  }

  const oldPath = existing.image_url?.includes(`/${PHOTO_BUCKET}/team/`)
    ? existing.image_url.split(`/${PHOTO_BUCKET}/`)[1]
    : null;
  if (oldPath) {
    await admin.storage.from(PHOTO_BUCKET).remove([oldPath]).catch(() => {});
  }
  return publicUrl;
}

// --- preview ---------------------------------------------------------------

/**
 * Everything the preview shows: all sections, and every group and member
 * that isn't archived, with a note on anything the public won't see.
 */
export async function adminPreviewData() {
  const [sections, groups, members] = await Promise.all([
    adminListSections(),
    adminListGroups(),
    adminListMembers(),
  ]);

  const view = groups
    .filter((g) => g.status !== "archived")
    .map((g) => {
      const inGroup = members.filter(
        (m) => m.status !== "archived" && m.memberships.some((ms) => ms.group_id === g.id),
      );
      const note =
        g.status === "hidden"
          ? "مجموعة مخفية — لا تظهر للزوار"
          : !inGroup.some((m) => m.status === "published")
            ? "لا أعضاء منشورون — لن تظهر للزوار"
            : undefined;
      return {
        id: g.id,
        name_ar: g.name_ar,
        description_ar: g.description_ar,
        note,
        members: inGroup.map((m) => ({
          id: m.id,
          full_name_ar: m.full_name_ar,
          title_ar: m.title_ar,
          bio_ar: m.bio_ar,
          image_url: m.image_url,
          note: m.status === "draft" ? "مسودة — لا تظهر للزوار" : undefined,
        })),
      };
    });

  return { sections, groups: sortMembers(view) };
}
