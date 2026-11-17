/**
 * Public «سؤال ندوات» wording, as approved on 16 Nov 2026. Change only with
 * approval; keep the site's gender-inclusive forms (المشاركين/ات، السوريات
 * والسوريين) and its tanween spelling (شكرًا، عمومًا).
 */
export const POLL_TEXT = {
  name: "سؤال ندوات",
  tagline: "رأيك جزء من الحوار",

  choosePrompt: "يُرجى اختيار إجابة واحدة.",
  submit: "تصويت",
  submitting: "جارٍ الإرسال…",
  footnote:
    "لا يتطلّب التصويت تسجيلًا ولا أي معلومات شخصية. سيتم الإعلان عن النتائج خلال الفقرة الأخيرة من الندوة.",

  thanks: "شكرًا لمشاركتك في سؤال ندوات.",
  resultsAnnounced: "سيتم الإعلان عن النتائج خلال الفقرة الأخيرة من الندوة.",
  alreadyVoted: "تم تسجيل مشاركتك في هذا الاستطلاع.",
  closed: "انتهى التصويت على هذا السؤال.",
  resultsPending: "لم تُنشر نتائج الاستطلاع بعد.",
  noPoll: "لا يوجد سؤال مفتوح للتصويت حاليًا.",
  browseEvents: "تصفّح الفعاليات",
  eventLink: "صفحة الندوة وروابط البثّ المباشر",

  errorNoChoice: "يُرجى اختيار إجابة قبل التصويت.",
  errorVerification: "تعذّر التحقّق من الطلب. يُرجى المحاولة مجدّدًا.",
  errorConnection: "تعذّر إرسال صوتك. يُرجى التحقّق من الاتصال والمحاولة مجدّدًا.",
  errorTooManyAttempts: "يُرجى المحاولة بعد قليل.",
  errorReload: "يُرجى إعادة تحميل الصفحة والمحاولة مجدّدًا.",
  errorUnexpected: "حدث خطأ غير متوقّع. يُرجى المحاولة مجدّدًا.",

  resultsHeading: "نتائج سؤال ندوات",
  totalLabel: "مجموع الأصوات:",
  disclaimer:
    "تعبّر هذه النتائج عن آراء المشاركين/ات في الاستطلاع، ولا تمثّل بالضرورة آراء السوريات والسوريين عمومًا.",
  excludedLabel: "عدد الأصوات المستبعدة بعد مراجعة إدارية:",

  shareDescription: "رأيك جزء من الحوار. التصويت لا يتطلّب تسجيلًا ولا أي معلومات شخصية.",
} as const;

/** «يُفتح التصويت يوم …، الساعة … بتوقيت دمشق.» */
export function opensAtText(date: string, time: string): string {
  return `يُفتح التصويت يوم ${date}، الساعة ${time} بتوقيت دمشق.`;
}
