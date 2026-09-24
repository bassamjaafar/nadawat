import "server-only";
import { hasSupabaseAdmin } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { participationReceivedEmail } from "@/lib/email/templates";
import { requestSubscription } from "@/lib/data/subscribers";
import { absoluteUrl } from "@/lib/url";
import { formatDate, formatTime } from "@/lib/format";
import {
  LIVE_ACK_LIMITED_TEXT,
  LIVE_ACK_TIME_TEXT,
  LIVE_RECORDING_CONSENT_TEXT,
  PARTICIPATE_NOTIFY_CONSENT_TEXT,
  type ParticipateInput,
} from "@/lib/validation";
import { getDebateBySlug } from "@/lib/data/debates";
import { isUpcoming } from "@/lib/types";

type Fingerprint = { ipHash: string | null; userAgent: string | null };

type ParticipateResult =
  | { status: "submitted" }
  | { status: "error"; message: string };

/**
 * A "شارك في الحوار" request: a written question/comment, or a request to
 * take part live by audio/video. This is not attendance registration —
 * watching needs none. The `registrations` table name is historical.
 */
export async function submitParticipation(
  input: ParticipateInput,
  fp: Fingerprint,
): Promise<ParticipateResult> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const live = input.participationType === "live";
  const debate = await getDebateBySlug(input.debateSlug);

  if (!debate || !isUpcoming(debate) || !debate.registration_open) {
    return {
      status: "error",
      message: "المشاركة غير متاحة لهذه الندوة حاليًا.",
    };
  }

  const sendConfirmation = () =>
    sendEmail({
      to: email,
      ...participationReceivedEmail({
        fullName,
        participationType: input.participationType,
        question: input.question,
        debateTitle: debate.title_ar,
        debateWhen: debate.starts_at
          ? `${formatDate(debate.starts_at, debate.timezone)} — ${formatTime(debate.starts_at, debate.timezone)} بتوقيت دمشق`
          : "يُعلَن لاحقًا",
        debateUrl: absoluteUrl(`/events/${debate.slug}`),
      }),
    });

  // General updates are a separate, explicit, double-opt-in subscription —
  // never implied by taking part.
  if (input.notifyFutureEvents) {
    const [firstName, ...rest] = fullName.split(/\s+/);
    await requestSubscription(
      {
        firstName,
        lastName: rest.join(" "),
        email,
        country: input.country.trim(),
        consent: true,
      },
      fp,
    );
  }

  if (!hasSupabaseAdmin) {
    await sendConfirmation();
    return { status: "submitted" };
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: inserted, error } = await supabase
    .from("registrations")
    .insert({
      debate_id: debate.id,
      full_name: fullName,
      email,
      country: input.country.trim(),
      participation_type: input.participationType,
      question: input.question.trim(),
      phone: live ? (input.phone ?? "").trim() : null,
      ack_limited_selection: live && input.ackLimited,
      ack_time_limit: live && input.ackTime,
      consent_recording_at: live && input.consentRecording ? now : null,
      notify_future_events: input.notifyFutureEvents,
      consent_at: input.notifyFutureEvents ? now : null,
      confirmation_sent_at: now,
      ip_hash: fp.ipHash,
      user_agent: fp.userAgent,
    })
    .select("id")
    .single();

  if (error) {
    console.error("submitParticipation", error.message);
    return {
      status: "error",
      message: "تعذّر إرسال طلبك الآن. يرجى المحاولة مجدّدًا بعد قليل.",
    };
  }

  const agreed = [
    ...(live
      ? [LIVE_ACK_LIMITED_TEXT, LIVE_ACK_TIME_TEXT, LIVE_RECORDING_CONSENT_TEXT]
      : []),
    ...(input.notifyFutureEvents ? [PARTICIPATE_NOTIFY_CONSENT_TEXT] : []),
  ];

  await supabase.from("consent_events").insert({
    subject_type: "registration",
    subject_id: inserted.id,
    email,
    action: live ? "participation_live" : "participation_written",
    consent_text: agreed.length ? agreed.join("\n") : null,
    ip_hash: fp.ipHash,
    user_agent: fp.userAgent,
  });

  await sendConfirmation();
  return { status: "submitted" };
}
