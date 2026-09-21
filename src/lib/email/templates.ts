import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { env } from "@/lib/env";

// The address shown/used as "contact us" in these transactional emails is
// the actual configured Reply-To, not the public CONTACT_EMAIL constant —
// events@nadawat.org has no real mailbox as of this writing, and showing an
// address that bounces in every subscriber-facing email would be worse than
// showing whatever address Reply-To is actually overridden to.
const REPLY_ADDRESS = env.EMAIL_REPLY_TO;

type Email = { subject: string; html: string; text: string };

/** User-submitted free text goes through this before landing in HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COLORS = {
  page: "#efe8d8",
  card: "#f8f4ea",
  ink: "#26241f",
  muted: "#5c574c",
  olive: "#46543d",
  cream: "#f5f0e6",
  line: "#ddd2b8",
};

function shell({
  preview,
  heading,
  body,
  cta,
  footNote,
}: {
  preview: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  footNote?: string;
}): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:6px;overflow:hidden;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<tr><td style="padding:28px 32px 0;">
<span style="font-size:20px;font-weight:700;color:${COLORS.olive};letter-spacing:.5px;">${SITE_NAME}</span>
<span style="font-size:13px;color:${COLORS.muted};margin-inline-start:8px;">${SITE_TAGLINE}</span>
</td></tr>
<tr><td style="padding:18px 32px 0;"><hr style="border:none;border-top:1px solid ${COLORS.line};margin:0;"></td></tr>
<tr><td style="padding:24px 32px 8px;">
<h1 style="margin:0 0 12px;font-size:20px;line-height:1.5;color:${COLORS.ink};font-weight:700;">${heading}</h1>
<div style="font-size:15px;line-height:1.9;color:${COLORS.ink};">${body}</div>
</td></tr>
${
  cta
    ? `<tr><td style="padding:12px 32px 20px;">
<a href="${cta.href}" style="display:inline-block;background:${COLORS.olive};color:${COLORS.cream};text-decoration:none;font-size:15px;font-weight:600;padding:12px 22px;border-radius:4px;">${cta.label}</a>
<p style="margin:14px 0 0;font-size:12px;color:${COLORS.muted};line-height:1.7;word-break:break-all;">${cta.href}</p>
</td></tr>`
    : ""
}
${
  footNote
    ? `<tr><td style="padding:0 32px 20px;"><p style="margin:0;font-size:13px;color:${COLORS.muted};line-height:1.8;">${footNote}</p></td></tr>`
    : ""
}
<tr><td style="padding:18px 32px 26px;border-top:1px solid ${COLORS.line};">
<p style="margin:0;font-size:12px;color:${COLORS.muted};line-height:1.8;">
هذه الرسالة من ${SITE_NAME}. للردّ أو الاستفسار راسلنا على
<a href="mailto:${REPLY_ADDRESS}" style="color:${COLORS.olive};">${REPLY_ADDRESS}</a> — نقرأ الردود.
<br>${SITE_URL.replace(/^https?:\/\//, "")}
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function subscribeConfirmEmail(input: {
  firstName: string;
  confirmUrl: string;
}): Email {
  const body = `<p style="margin:0 0 12px;">مرحبًا ${input.firstName},</p>
<p style="margin:0 0 12px;">تلقّينا طلب اشتراكك في إشعارات ندوات. لتأكيد اشتراكك، يرجى الضغط على الزرّ أدناه.</p>
<p style="margin:0;">إن لم تكن أنت من طلب ذلك، تجاهل هذه الرسالة ولن يُضاف بريدك إلى أي قائمة.</p>`;
  return {
    subject: "أكِّد اشتراكك في ندوات",
    html: shell({
      preview: "خطوة أخيرة لتأكيد اشتراكك في إشعارات ندوات",
      heading: "خطوة أخيرة لتأكيد اشتراكك",
      body,
      cta: { label: "تأكيد الاشتراك", href: input.confirmUrl },
      footNote: "الرابط صالح لهذا الطلب فقط.",
    }),
    text: `مرحبًا ${input.firstName}،\n\nلتأكيد اشتراكك في إشعارات ندوات افتح الرابط التالي:\n${input.confirmUrl}\n\nإن لم تطلب ذلك، تجاهل هذه الرسالة.\n\n${REPLY_ADDRESS}`,
  };
}

export function subscribeConfirmedEmail(input: {
  firstName: string;
  unsubscribeUrl: string;
}): Email {
  const body = `<p style="margin:0 0 12px;">مرحبًا ${input.firstName},</p>
<p style="margin:0 0 12px;">تمّ تأكيد اشتراكك. سنرسل إليك إشعارًا موجزًا عند تحديد موعد كل ندوة جديدة — دون رسائل متكرّرة.</p>
<p style="margin:0;">يمكنك إلغاء الاشتراك في أي وقت من الرابط أدناه أو من تذييل أي رسالة.</p>`;
  return {
    subject: "تمّ تأكيد اشتراكك في ندوات",
    html: shell({
      preview: "تمّ تأكيد اشتراكك في إشعارات ندوات",
      heading: "تمّ تأكيد اشتراكك",
      body,
      footNote: `لإلغاء الاشتراك: <a href="${input.unsubscribeUrl}" style="color:${COLORS.olive};">اضغط هنا</a>`,
    }),
    text: `مرحبًا ${input.firstName}،\n\nتمّ تأكيد اشتراكك في إشعارات ندوات.\n\nلإلغاء الاشتراك في أي وقت:\n${input.unsubscribeUrl}\n\n${REPLY_ADDRESS}`,
  };
}

export function registrationConfirmedEmail(input: {
  firstName: string;
  debateTitle: string;
  debateWhen: string;
  debateUrl: string;
}): Email {
  const body = `<p style="margin:0 0 12px;">مرحبًا ${input.firstName},</p>
<p style="margin:0 0 12px;">سجّلنا حضورك في ندوة:</p>
<p style="margin:0 0 6px;font-weight:600;color:${COLORS.olive};">«${input.debateTitle}»</p>
<p style="margin:0 0 12px;">الموعد: ${input.debateWhen}</p>
<p style="margin:0;">سنرسل إليك تفاصيل الحضور ورابط البثّ قبل الموعد.</p>`;
  return {
    subject: `تأكيد تسجيلك: ${input.debateTitle}`,
    html: shell({
      preview: `تأكيد تسجيلك في ندوة ${input.debateTitle}`,
      heading: "تمّ تسجيل حضورك",
      body,
      cta: { label: "صفحة الندوة", href: input.debateUrl },
    }),
    text: `مرحبًا ${input.firstName}،\n\nسجّلنا حضورك في ندوة «${input.debateTitle}».\nالموعد: ${input.debateWhen}\n\nصفحة الندوة: ${input.debateUrl}\n\n${REPLY_ADDRESS}`,
  };
}

/**
 * Internal notification for the team's inbox, not a subscriber-facing
 * branded email — skips `shell()` on purpose (its fixed footer telling the
 * reader to email CONTACT_EMAIL makes no sense on a message already sent
 * there). Reply-To is set to the submitter's own address by the caller, so
 * replying in the inbox goes straight back to them.
 */
export function contactMessageEmail(input: {
  name: string;
  email: string;
  category: string;
  message: string;
}): Email {
  const safeName = escapeHtml(input.name);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br>");

  return {
    subject: `رسالة تواصل جديدة (${input.category}): ${input.name}`,
    html: `<!doctype html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:${COLORS.page};font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:6px;">
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 4px;font-size:13px;color:${COLORS.muted};">رسالة تواصل جديدة من الموقع</p>
<h1 style="margin:0 0 18px;font-size:19px;color:${COLORS.ink};">${input.category}</h1>
<p style="margin:0 0 6px;font-size:14px;color:${COLORS.muted};">الاسم</p>
<p style="margin:0 0 16px;font-size:15px;color:${COLORS.ink};">${safeName}</p>
<p style="margin:0 0 6px;font-size:14px;color:${COLORS.muted};">البريد الإلكتروني</p>
<p style="margin:0 0 16px;font-size:15px;color:${COLORS.ink};" dir="ltr">${escapeHtml(input.email)}</p>
<p style="margin:0 0 6px;font-size:14px;color:${COLORS.muted};">الرسالة</p>
<p style="margin:0;font-size:15px;line-height:1.9;color:${COLORS.ink};white-space:pre-wrap;">${safeMessage}</p>
</td></tr>
</table>
</body>
</html>`,
    text: `رسالة تواصل جديدة من الموقع\nالنوع: ${input.category}\nالاسم: ${input.name}\nالبريد: ${input.email}\n\nالرسالة:\n${input.message}`,
  };
}
