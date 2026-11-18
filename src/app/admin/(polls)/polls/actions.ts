"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminCreatePoll,
  adminDeletePoll,
  adminExcludeVotes,
  adminGetPoll,
  adminRevertExclusion,
  adminSetClosesAt,
  adminSetProtection,
  adminSetStatus,
  adminUpdatePoll,
  getAdminRole,
} from "@/lib/admin/polls";
import {
  dbMessage,
  exclusionSchema,
  pollFormValues,
  pollSchema,
} from "@/lib/admin/poll-validation";
import { fieldErrors } from "@/lib/admin/validation";
import { fromDamascusInputValue } from "@/lib/admin/datetime";
import type { FormState } from "@/lib/forms";
import type { PollStatus } from "@/lib/polls/types";

// Every action re-checks the role here, and the database checks it again
// (RLS, triggers and the security-definer functions in 0005/0006).
const NOT_ALLOWED: FormState = { status: "error", message: "هذا الإجراء غير متاح لحسابك." };

async function revalidatePoll(id: string) {
  revalidatePath("/admin/polls");
  revalidatePath(`/admin/polls/${id}`);
  revalidatePath("/vote");
  revalidatePath("/");
  const poll = await adminGetPoll(id).catch(() => null);
  if (poll?.debate?.slug) revalidatePath(`/events/${poll.debate.slug}`);
}

function invalid(error: Parameters<typeof fieldErrors>[0]): FormState {
  return { status: "error", message: "يُرجى مراجعة الحقول المطلوبة.", errors: fieldErrors(error) };
}

export async function createPollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminRole())) return NOT_ALLOWED;
  const parsed = pollSchema.safeParse(pollFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);

  let id: string;
  try {
    id = await adminCreatePoll(parsed.data);
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر إنشاء السؤال.") };
  }
  revalidatePath("/admin/polls");
  redirect(`/admin/polls/${id}`);
}

export async function updatePollAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await getAdminRole())) return NOT_ALLOWED;
  const parsed = pollSchema.safeParse(pollFormValues(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    await adminUpdatePoll(id, parsed.data);
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر حفظ التعديلات.") };
  }
  await revalidatePoll(id);
  return { status: "success", message: "تمّ الحفظ." };
}

export async function setClosesAtAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await getAdminRole())) return NOT_ALLOWED;
  const raw = String(formData.get("closes_at") ?? "").trim();
  if (raw && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
    return { status: "error", message: "صيغة التاريخ غير صالحة." };
  }
  try {
    await adminSetClosesAt(id, fromDamascusInputValue(raw));
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر حفظ موعد الإغلاق.") };
  }
  await revalidatePoll(id);
  return { status: "success", message: raw ? "تمّ حفظ موعد الإغلاق التلقائي." : "أُلغي الإغلاق التلقائي." };
}

const STATUSES: PollStatus[] = ["draft", "scheduled", "open", "closed", "published"];

export async function setStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminRole())) return NOT_ALLOWED;
  const id = String(formData.get("id") ?? "");
  const expected = String(formData.get("expected") ?? "") as PollStatus;
  const to = String(formData.get("to") ?? "") as PollStatus;
  if (!STATUSES.includes(expected) || !STATUSES.includes(to)) return NOT_ALLOWED;
  try {
    await adminSetStatus(id, expected, to);
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر تغيير الحالة.") };
  }
  await revalidatePoll(id);
  return { status: "success", message: "تمّ تحديث الحالة." };
}

export async function setProtectionAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if ((await getAdminRole()) !== "admin") return NOT_ALLOWED;
  const warn = Number(formData.get("warn_per_10min"));
  const alert = Number(formData.get("alert_per_10min"));
  if (!Number.isInteger(warn) || warn < 1 || !Number.isInteger(alert) || alert < 1) {
    return { status: "error", message: "يُرجى إدخال أعداد صحيحة أكبر من صفر." };
  }
  if (alert <= warn) {
    return { status: "error", message: "يجب أن يكون حدّ التنبيه العاجل أعلى من حدّ التحذير." };
  }
  try {
    await adminSetProtection(id, {
      require_turnstile: formData.get("require_turnstile") === "on",
      warn_per_10min: warn,
      alert_per_10min: alert,
    });
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر حفظ الإعدادات.") };
  }
  await revalidatePoll(id);
  return { status: "success", message: "تمّ حفظ إعدادات الحماية وتسجيلها في السجلّ." };
}

export async function deletePollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getAdminRole())) return NOT_ALLOWED;
  const id = String(formData.get("id") ?? "");
  try {
    await adminDeletePoll(id);
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر حذف السؤال.") };
  }
  revalidatePath("/admin/polls");
  redirect("/admin/polls");
}

export async function excludeVotesAction(
  pollId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if ((await getAdminRole()) !== "admin") return NOT_ALLOWED;
  const parsed = exclusionSchema.safeParse({
    label: formData.get("label"),
    from: formData.get("from"),
    to: formData.get("to"),
    evidence: formData.getAll("evidence"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return { status: "error", message: "يُرجى مراجعة الحقول.", errors: fieldErrors(parsed.error) };
  }
  let n: number;
  try {
    n = await adminExcludeVotes({
      pollId,
      label: parsed.data.label,
      // The minute picked is inclusive: "to 21:14" means up to 21:14:59.
      from: fromDamascusInputValue(parsed.data.from)!,
      to: new Date(new Date(fromDamascusInputValue(parsed.data.to)!).getTime() + 59_999).toISOString(),
      evidence: parsed.data.evidence,
      reason: parsed.data.reason,
    });
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر الاستبعاد.") };
  }
  await revalidatePoll(pollId);
  return { status: "success", message: `استُبعد ${n} صوت/أصوات، وسُجّل ذلك في السجلّ. يمكن التراجع قبل النشر.` };
}

export async function revertExclusionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if ((await getAdminRole()) !== "admin") return NOT_ALLOWED;
  const pollId = String(formData.get("poll_id") ?? "");
  const exclusionId = String(formData.get("exclusion_id") ?? "");
  let n: number;
  try {
    n = await adminRevertExclusion(exclusionId);
  } catch (e) {
    return { status: "error", message: dbMessage(e, "تعذّر التراجع.") };
  }
  await revalidatePoll(pollId);
  return { status: "success", message: `أُعيد احتساب ${n} صوت/أصوات.` };
}
