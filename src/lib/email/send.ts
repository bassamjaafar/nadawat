import "server-only";
import { Resend } from "resend";
import { env, hasResend } from "@/lib/env";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Overrides EMAIL_REPLY_TO — e.g. the contact form replies straight to
   * whoever wrote in, so the team can just hit "reply" in their inbox. */
  replyTo?: string;
};

let client: Resend | null = null;
function resend(): Resend {
  client ??= new Resend(env.RESEND_API_KEY);
  return client;
}

/**
 * Sends a transactional email via Resend. Sender identity and Reply-To come
 * from env (Reply-To is an externally hosted, monitored mailbox — never a
 * noreply address). When RESEND_API_KEY is absent the message is logged and
 * treated as sent, so local flows still complete.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendArgs): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!hasResend) {
    console.info(
      `[email:dev] would send "${subject}" to ${to}\n${text}\n---`,
    );
    return { ok: true, skipped: true };
  }

  try {
    const { error } = await resend().emails.send({
      from: env.EMAIL_FROM,
      replyTo: replyTo ?? env.EMAIL_REPLY_TO,
      to,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("[email] resend error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { ok: false, error: (err as Error).message };
  }
}
