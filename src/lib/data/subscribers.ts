import "server-only";
import { randomUUID } from "node:crypto";
import { hasSupabaseAdmin } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  subscribeConfirmedEmail,
  subscribeConfirmEmail,
} from "@/lib/email/templates";
import { confirmSubscriptionUrl, unsubscribeUrl } from "@/lib/url";
import { SUBSCRIBE_CONSENT_TEXT, type SubscribeInput } from "@/lib/validation";

type Fingerprint = { ipHash: string | null; userAgent: string | null };

type RequestResult =
  | { status: "sent"; devConfirmUrl?: string }
  | { status: "already_confirmed" }
  | { status: "error"; message: string };

async function logConsent(
  subjectId: string,
  email: string,
  action: string,
  fp: Fingerprint,
  consentText?: string,
) {
  const supabase = getSupabaseAdminClient();
  await supabase.from("consent_events").insert({
    subject_type: "subscriber",
    subject_id: subjectId,
    email,
    action,
    consent_text: consentText ?? null,
    ip_hash: fp.ipHash,
    user_agent: fp.userAgent,
  });
}

/**
 * The subscribe form sends email (+ optional first name). The participation
 * form's newsletter opt-in still supplies a last name and country, and passes
 * the exact consent wording it displayed (defaults to the subscribe form's).
 */
type SubscriptionRequest = SubscribeInput & {
  lastName?: string;
  country?: string;
  consentText?: string;
};

export async function requestSubscription(
  input: SubscriptionRequest,
  fp: Fingerprint,
): Promise<RequestResult> {
  const email = String(input.email).trim().toLowerCase();
  const firstName = (input.firstName ?? "").trim();
  const consentText = input.consentText ?? SUBSCRIBE_CONSENT_TEXT;
  // The DB columns are NOT NULL, so fields the form no longer collects are
  // stored as "" rather than null — no migration needed.
  const profile = {
    first_name: firstName,
    last_name: (input.lastName ?? "").trim(),
    country: (input.country ?? "").trim(),
  };

  if (!hasSupabaseAdmin) {
    const token = randomUUID();
    const confirmUrl = confirmSubscriptionUrl(token);
    await sendEmail({ to: email, ...subscribeConfirmEmail({ firstName, confirmUrl }) });
    return { status: "sent", devConfirmUrl: confirmUrl };
  }

  const supabase = getSupabaseAdminClient();

  const { data: existing, error: readErr } = await supabase
    .from("subscribers")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (readErr) return { status: "error", message: readErr.message };

  if (existing?.status === "confirmed") {
    return { status: "already_confirmed" };
  }

  const confirmationToken = randomUUID();
  const now = new Date().toISOString();
  const payload = {
    email,
    status: "pending" as const,
    consent_text: consentText,
    consent_at: now,
    confirmation_token: confirmationToken,
    confirmation_sent_at: now,
    source: "website",
    ip_hash: fp.ipHash,
    user_agent: fp.userAgent,
    updated_at: now,
  };

  let subscriberId: string;
  if (existing) {
    // Re-subscribing (pending/unsubscribed) — refresh consent and token, but
    // never overwrite a stored name or country with a blank from the shorter
    // form: only non-empty profile values are written.
    const filledProfile = Object.fromEntries(
      Object.entries(profile).filter(([, v]) => v !== ""),
    );
    const { data, error } = await supabase
      .from("subscribers")
      .update({ ...payload, ...filledProfile })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) return { status: "error", message: error.message };
    subscriberId = data.id;
  } else {
    const { data, error } = await supabase
      .from("subscribers")
      .insert({ ...payload, ...profile })
      .select("id")
      .single();
    if (error) return { status: "error", message: error.message };
    subscriberId = data.id;
  }

  await logConsent(
    subscriberId,
    email,
    "opt_in_requested",
    fp,
    consentText,
  );

  const result = await sendEmail({
    to: email,
    ...subscribeConfirmEmail({
      firstName,
      confirmUrl: confirmSubscriptionUrl(confirmationToken),
    }),
  });
  if (!result.ok) return { status: "error", message: result.error ?? "email" };

  return { status: "sent" };
}

type ConfirmResult =
  | { status: "confirmed"; firstName: string }
  | { status: "already" }
  | { status: "invalid" };

export async function confirmSubscription(
  token: string,
): Promise<ConfirmResult> {
  if (!hasSupabaseAdmin) {
    // Demo mode: any non-empty token "confirms".
    return token ? { status: "confirmed", firstName: "صديقنا" } : { status: "invalid" };
  }

  const supabase = getSupabaseAdminClient();
  const { data: sub, error } = await supabase
    .from("subscribers")
    .select("id, email, first_name, status")
    .eq("confirmation_token", token)
    .maybeSingle();

  if (error || !sub) {
    // Token may already have been rotated on a previous confirm.
    return { status: "invalid" };
  }

  if (sub.status === "confirmed") return { status: "already" };

  const now = new Date().toISOString();
  const newUnsubToken = randomUUID();
  const { error: updErr } = await supabase
    .from("subscribers")
    .update({
      status: "confirmed",
      confirmed_at: now,
      confirmation_token: randomUUID(), // rotate — one-time use
      unsubscribe_token: newUnsubToken,
      updated_at: now,
    })
    .eq("id", sub.id);
  if (updErr) return { status: "invalid" };

  await logConsent(sub.id, sub.email, "opt_in_confirmed", {
    ipHash: null,
    userAgent: null,
  });

  await sendEmail({
    to: sub.email,
    ...subscribeConfirmedEmail({
      firstName: sub.first_name,
      unsubscribeUrl: unsubscribeUrl(newUnsubToken),
    }),
  });

  return { status: "confirmed", firstName: sub.first_name };
}

type UnsubResult =
  | { status: "done"; firstName: string }
  | { status: "invalid" };

export async function unsubscribe(token: string): Promise<UnsubResult> {
  if (!hasSupabaseAdmin) {
    return token ? { status: "done", firstName: "صديقنا" } : { status: "invalid" };
  }

  const supabase = getSupabaseAdminClient();
  const { data: sub, error } = await supabase
    .from("subscribers")
    .select("id, email, first_name, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !sub) return { status: "invalid" };

  const now = new Date().toISOString();
  await supabase
    .from("subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: now, updated_at: now })
    .eq("id", sub.id);

  await logConsent(sub.id, sub.email, "unsubscribed", {
    ipHash: null,
    userAgent: null,
  });

  return { status: "done", firstName: sub.first_name };
}
