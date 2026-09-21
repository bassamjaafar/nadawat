"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminCreatePerson,
  adminDeletePerson,
  adminUpdatePerson,
  adminUploadPersonPhoto,
} from "@/lib/admin/people";
import { requireAdminClient } from "@/lib/admin/auth";
import { personSchema, fieldErrors } from "@/lib/admin/validation";
import type { FormState } from "@/lib/forms";

// Any page a person's photo/name could appear on — there's no per-event
// link from a person back to which debates feature them, so this just
// revalidates broadly rather than trying to be precise.
function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/events/[slug]", "page");
}

export async function createPersonFormAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = personSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  let id: string;
  try {
    const person = await adminCreatePerson(parsed.data);
    id = person.id;
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر إضافة الشخص.",
    };
  }

  revalidatePublicPages();
  redirect(`/admin/people/${id}`);
}

export async function updatePersonAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = personSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    await adminUpdatePerson(id, parsed.data);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر حفظ التعديلات.",
    };
  }

  revalidatePublicPages();
  return { status: "success", message: "تمّ الحفظ." };
}

export async function deletePersonAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id"));

  try {
    await adminDeletePerson(id);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر حذف الشخص.",
    };
  }

  // Kept outside the try/catch — redirect() throws internally, and a
  // generic catch above would otherwise mistake that for a real error.
  revalidatePublicPages();
  redirect("/admin/people");
}

export async function uploadPhotoAction(
  personId: string,
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  // Uses the service-role client internally (see adminUploadPersonPhoto) —
  // this explicit check is the only thing standing between an unauthorized
  // caller and a storage write, since there's no RLS policy backing it.
  const admin = await requireAdminClient();
  if (!admin) return { error: "غير مخوَّل." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "يرجى اختيار صورة." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: "الصورة أكبر من 5 ميغابايت." };
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "الصيغ المسموحة: JPG، PNG، WEBP." };
  }

  try {
    const url = await adminUploadPersonPhoto(personId, file);
    revalidatePublicPages();
    return { url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "تعذّر رفع الصورة.",
    };
  }
}
