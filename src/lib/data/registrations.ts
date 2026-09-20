import "server-only";
import { hasSupabaseAdmin } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { registrationConfirmedEmail } from "@/lib/email/templates";
import { requestSubscription } from "@/lib/data/subscribers";
import { absoluteUrl } from "@/lib/url";
import { formatDate, formatTime } from "@/lib/format";
import { REGISTER_CONSENT_TEXT, type RegisterInput } from "@/lib/validation";
import { getDebateBySlug } from "@/lib/data/debates";

type Fingerprint = { ipHash: string | null; userAgent: string | null };

type RegisterResult =
  | { status: "registered" }
  | { status: "already" }
  | { status: "error"; message: string };

export async function registerForDebate(
  input: RegisterInput,
  fp: Fingerprint,
): Promise<RegisterResult> {
  const email = String(input.email).trim().toLowerCase();
  const firstName = input.firstName.trim();
  const debate = await getDebateBySlug(input.debateSlug);

  if (!debate || debate.status !== "upcoming" || !debate.registration_open) {
    return { status: "error", message: "التسجيل غير متاح لهذه الندوة حاليًا." };
  }

  const debateWhen = debate.starts_at
    ? `${formatDate(debate.starts_at, debate.timezone)} — ${formatTime(debate.starts_at, debate.timezone)}`
    : "يُعلَن لاحقًا";
  const debateUrl = absoluteUrl(`/debates/${debate.slug}`);

  const sendConfirmation = () =>
    sendEmail({
      to: email,
      ...registrationConfirmedEmail({
        firstName,
        debateTitle: debate.title_ar,
        debateWhen,
        debateUrl,
      }),
    });

  // Marketing consent is handled through the standard double opt-in flow,
  // entirely separate from the registration record.
  if (input.notifyFutureEvents) {
    await requestSubscription(
      {
        firstName,
        lastName: input.lastName.trim(),
        email,
        country: input.country.trim(),
        consent: true,
      },
      fp,
    );
  }

  if (!hasSupabaseAdmin) {
    await sendConfirmation();
    return { status: "registered" };
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("registrations")
    .select("id")
    .eq("debate_id", debate.id)
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    await sendConfirmation();
    return { status: "already" };
  }

  const { data: inserted, error } = await supabase
    .from("registrations")
    .insert({
      debate_id: debate.id,
      first_name: firstName,
      last_name: input.lastName.trim(),
      email,
      country: input.country.trim(),
      notify_future_events: input.notifyFutureEvents,
      consent_at: input.notifyFutureEvents ? now : null,
      confirmation_sent_at: now,
      ip_hash: fp.ipHash,
      user_agent: fp.userAgent,
    })
    .select("id")
    .single();

  if (error) return { status: "error", message: error.message };

  await supabase.from("consent_events").insert({
    subject_type: "registration",
    subject_id: inserted.id,
    email,
    action: "registration",
    consent_text: input.notifyFutureEvents ? REGISTER_CONSENT_TEXT : null,
    ip_hash: fp.ipHash,
    user_agent: fp.userAgent,
  });

  await sendConfirmation();
  return { status: "registered" };
}
