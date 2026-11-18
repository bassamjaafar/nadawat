import type { PollStatus } from "@/lib/polls/types";

export const STATUS_LABEL: Record<PollStatus, string> = {
  draft: "مسودّة",
  scheduled: "مجدول",
  open: "مفتوح للتصويت",
  closed: "مغلق — النتائج غير منشورة",
  published: "النتائج منشورة",
};

export const STATUS_TONE: Record<PollStatus, string> = {
  draft: "border-line-strong text-muted",
  scheduled: "border-[#c9b27a] text-[#7a5d1c] bg-[#f7efd9]",
  open: "border-olive text-olive bg-[#eef2ea]",
  closed: "border-line-strong text-ink bg-cream-deep",
  published: "border-[#7c8c6a] text-[#3f4d31] bg-[#e4eadc]",
};

export const CHECK_LABEL: Record<string, string> = {
  passed: "تحقّق Cloudflare ناجح",
  unavailable: "تعذّر الوصول إلى Cloudflare (قُبل الصوت)",
  disabled: "التحقّق مُوقَف لهذا السؤال",
};

export const REFUSAL_LABEL: Record<string, string> = {
  no_token: "لم يكتمل مربّع التحقّق قبل الإرسال",
  invalid_token: "رمز تحقّق مرفوض (غير صالح أو مزوّر)",
  expired_or_reused: "رمز تحقّق منتهي الصلاحية أو مستخدَم سابقًا",
  hostname_mismatch: "رمز تحقّق صادر عن موقع آخر",
  server_config: "خطأ في إعداد مفتاح Cloudflare على الخادم",
  rate_limited: "محاولات كثيرة من المتصفّح نفسه (أكثر من 10 خلال 10 دقائق)",
  other: "سبب آخر",
};

const STATUS_WORD: Record<string, string> = {
  draft: "مسودّة",
  scheduled: "مجدول",
  open: "مفتوح",
  closed: "مغلق",
  published: "منشور",
};

export function auditLabel(action: string): string {
  const m = /^status_(\w+?)_to_(\w+)$/.exec(action);
  if (m) {
    const [, from, to] = m;
    if (to === "open" && from === "closed") return "إعادة فتح التصويت";
    if (to === "open") return "فتح التصويت";
    if (to === "scheduled") return "جدولة فتح التصويت";
    if (to === "draft") return "إلغاء الجدولة";
    if (to === "closed" && from === "published") return "إخفاء النتائج المنشورة";
    if (to === "closed") return "إغلاق التصويت";
    if (to === "published") return "نشر النتائج";
    return `تغيير الحالة: ${STATUS_WORD[from] ?? from} ← ${STATUS_WORD[to] ?? to}`;
  }
  return (
    {
      created: "إنشاء السؤال",
      edited: "تعديل السؤال أو المواعيد",
      settings_changed: "تغيير إعدادات الحماية",
      votes_excluded: "استبعاد أصوات بعد مراجعة",
      exclusion_reverted: "التراجع عن استبعاد",
    }[action] ?? action
  );
}

/** One readable line of detail for an audit entry, without any answer. */
export function auditDetail(action: string, d: Record<string, unknown>): string | null {
  if (action === "settings_changed") {
    const parts: string[] = [];
    const t = d.require_turnstile as [boolean, boolean] | undefined;
    if (t && t[0] !== t[1]) parts.push(`تحقّق Cloudflare: ${t[1] ? "مفعّل" : "مُوقَف"}`);
    const w = d.warn_per_10min as [number, number] | undefined;
    if (w && w[0] !== w[1]) parts.push(`حدّ التحذير: ${w[0]} ← ${w[1]}`);
    const a = d.alert_per_10min as [number, number] | undefined;
    if (a && a[0] !== a[1]) parts.push(`حدّ التنبيه العاجل: ${a[0]} ← ${a[1]}`);
    return parts.join(" · ") || null;
  }
  if (action === "votes_excluded") {
    return `الشبكة ${d.network} · ${d.votes} صوت/أصوات · السبب: ${d.reason}`;
  }
  if (action === "exclusion_reverted") {
    return `الشبكة ${d.network} · ${d.votes} صوت/أصوات أُعيد احتسابها`;
  }
  return null;
}
