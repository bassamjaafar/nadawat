import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { CONTACT_EMAIL } from "@/lib/site";

/** TEMPORARY — diagnosing why the contact form isn't reaching the override. */
export async function GET() {
  return NextResponse.json({
    contactFormRecipientSet: Boolean(env.CONTACT_FORM_RECIPIENT),
    contactFormRecipientValue: env.CONTACT_FORM_RECIPIENT ?? null,
    fallbackContactEmail: CONTACT_EMAIL,
    effectiveRecipient: env.CONTACT_FORM_RECIPIENT ?? CONTACT_EMAIL,
  });
}
