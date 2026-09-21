"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminCreateEvent,
  adminDeleteEvent,
  adminGetEvent,
  adminSetParticipants,
  adminUpdateEvent,
} from "@/lib/admin/events";
import { adminCreatePerson } from "@/lib/admin/people";
import {
  eventSchema,
  fieldErrors,
  personSchema,
  type PersonInput,
} from "@/lib/admin/validation";
import type { FormState } from "@/lib/forms";
import type { Person } from "@/lib/types";

function revalidatePublicPages(slug?: string) {
  revalidatePath("/");
  revalidatePath("/events");
  if (slug) revalidatePath(`/events/${slug}`);
}

export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  let id: string;
  try {
    id = await adminCreateEvent(parsed.data);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر إنشاء الندوة.",
    };
  }

  revalidatePublicPages(parsed.data.slug);
  redirect(`/admin/events/${id}`);
}

export async function updateEventAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "يرجى مراجعة الحقول المطلوبة.",
      errors: fieldErrors(parsed.error),
    };
  }

  try {
    await adminUpdateEvent(id, parsed.data);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر حفظ التعديلات.",
    };
  }

  revalidatePublicPages(parsed.data.slug);
  return { status: "success", message: "تمّ الحفظ." };
}

export async function deleteEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const id = String(formData.get("id"));
  const slug = formData.get("slug") ? String(formData.get("slug")) : undefined;

  try {
    await adminDeleteEvent(id);
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "تعذّر حذف الندوة.",
    };
  }

  // redirect() throws internally to interrupt rendering — kept outside the
  // try/catch above so that signal is never accidentally swallowed as an
  // "error" by the catch block.
  revalidatePublicPages(slug);
  redirect("/admin/events");
}

export async function createPersonAction(
  input: PersonInput,
): Promise<{ person: Person } | { error: string }> {
  const parsed = personSchema.safeParse(input);
  if (!parsed.success) {
    return { error: Object.values(fieldErrors(parsed.error))[0] ?? "بيانات غير صالحة." };
  }
  try {
    const person = await adminCreatePerson(parsed.data);
    return { person };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "تعذّر إضافة الشخص." };
  }
}

export async function saveParticipantsAction(
  debateId: string,
  input: {
    moderatorId: string | null;
    speakers: { personId: string; positionLabel: string | null }[];
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    await adminSetParticipants(debateId, input);
    const event = await adminGetEvent(debateId);
    revalidatePublicPages(event?.slug);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "تعذّر حفظ الضيوف." };
  }
}
