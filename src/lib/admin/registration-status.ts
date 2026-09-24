export const REGISTRATION_STATUSES = {
  new: "جديد",
  selected: "تمّ اختياره للمشاركة المباشرة",
  not_selected: "لم يتم اختياره",
  participated: "شارك",
} as const;

export type RegistrationStatus = keyof typeof REGISTRATION_STATUSES;

export const PARTICIPATION_TYPE_LABELS = {
  written: "سؤال أو مداخلة مكتوبة",
  live: "مشاركة مباشرة بالصوت والصورة",
} as const;
