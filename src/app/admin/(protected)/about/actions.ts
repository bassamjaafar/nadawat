"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminClient } from "@/lib/admin/auth";
import {
  adminCreateGroup,
  adminCreateMember,
  adminGetMember,
  adminUpdateGroup,
  adminUpdateMember,
  adminUpdateSection,
  adminUploadMemberPhoto,
} from "@/lib/admin/about";
import { groupSchema, memberSchema, sectionSchema } from "@/lib/admin/about-validation";
import { fieldErrors } from "@/lib/admin/validation";
import { isAboutSectionKey } from "@/lib/about/content";
import { missingForPublication } from "@/lib/about/team";
import type { FormState } from "@/lib/forms";

const CHECK_FIELDS = "يرجى مراجعة الحقول المطلوبة.";

function refresh() {
  revalidatePath("/about");
  revalidatePath("/admin/about", "layout");
}

function failed(err: unknown, fallback: string): FormState {
  console.error("about admin", err);
  return { status: "error", message: fallback };
}

// --- sections --------------------------------------------------------------

export async function updateSectionAction(
  key: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isAboutSectionKey(key)) return { status: "error", message: "قسم غير معروف." };
  const parsed = sectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, errors: fieldErrors(parsed.error) };
  }
  try {
    await adminUpdateSection(key, parsed.data);
  } catch (err) {
    return failed(err, "تعذّر حفظ القسم.");
  }
  refresh();
  return { status: "success", message: "تمّ الحفظ." };
}

// --- groups ----------------------------------------------------------------

export async function createGroupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, errors: fieldErrors(parsed.error) };
  }
  try {
    await adminCreateGroup(parsed.data);
  } catch (err) {
    return failed(err, "تعذّر إضافة المجموعة.");
  }
  refresh();
  redirect("/admin/about/groups");
}

export async function updateGroupAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = groupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, errors: fieldErrors(parsed.error) };
  }
  try {
    await adminUpdateGroup(id, parsed.data);
  } catch (err) {
    return failed(err, "تعذّر حفظ المجموعة.");
  }
  refresh();
  return { status: "success", message: "تمّ الحفظ." };
}

// --- members ---------------------------------------------------------------

function publishBlocked(missing: string[]): FormState {
  return {
    status: "error",
    message: `لا يمكن نشر الملف قبل إكمال: ${missing.join("، ")}.`,
    errors: { status: "يُحفظ الملف كمسودة إلى أن تكتمل البيانات المطلوبة." },
  };
}

export async function createMemberAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, errors: fieldErrors(parsed.error) };
  }
  // A new profile has no photo yet, so it can't be published straight away.
  if (parsed.data.status === "published") {
    return publishBlocked(missingForPublication({
      full_name_ar: parsed.data.full_name_ar,
      title_ar: parsed.data.title_ar ?? "",
      bio_ar: parsed.data.bio_ar ?? "",
      image_url: null,
      consent_given: parsed.data.consent_given,
    }));
  }
  let id: string;
  try {
    id = await adminCreateMember(parsed.data);
  } catch (err) {
    return failed(err, "تعذّر إضافة العضو/ة.");
  }
  refresh();
  redirect(`/admin/about/members/${id}?created=1`);
}

export async function updateMemberAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = memberSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: CHECK_FIELDS, errors: fieldErrors(parsed.error) };
  }
  try {
    if (parsed.data.status === "published") {
      const current = await adminGetMember(id);
      const missing = missingForPublication({
        full_name_ar: parsed.data.full_name_ar,
        title_ar: parsed.data.title_ar ?? "",
        bio_ar: parsed.data.bio_ar ?? "",
        image_url: current?.image_url ?? null,
        consent_given: parsed.data.consent_given,
      });
      if (missing.length) return publishBlocked(missing);
    }
    await adminUpdateMember(id, parsed.data);
  } catch (err) {
    return failed(err, "تعذّر حفظ التعديلات.");
  }
  refresh();
  return { status: "success", message: "تمّ الحفظ." };
}

export async function uploadMemberPhotoAction(
  memberId: string,
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  // The file goes through the service-role client (see adminUploadMemberPhoto);
  // this check is what keeps that admin-only.
  const admin = await requireAdminClient();
  if (!admin) return { error: "غير مخوَّل." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "يرجى اختيار صورة." };
  if (file.size > 5 * 1024 * 1024) return { error: "الصورة أكبر من 5 ميغابايت." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "الصيغ المسموحة: JPG، PNG، WEBP." };
  }

  try {
    const url = await adminUploadMemberPhoto(memberId, file);
    refresh();
    return { url };
  } catch (err) {
    console.error("member photo upload failed", err);
    return { error: "تعذّر رفع الصورة. يُرجى المحاولة مرة أخرى." };
  }
}
