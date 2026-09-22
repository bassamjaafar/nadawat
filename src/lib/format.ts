/**
 * Syrian-Arabic date & time formatting — the single source of truth for
 * every date shown on the site. Locale is deliberately "ar-SY", not the
 * generic "ar": generic Arabic (and most Gulf locales) render Gregorian
 * months as transliterations of the English names (يوليو for July), while
 * Syria — like the rest of the Levant — uses the older Arabic month names
 * (تموز for July). Western digits throughout for legibility in metadata.
 */

export const DEFAULT_TZ = "Asia/Damascus";
const LOCALE = "ar-SY";

function d(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
    numberingSystem: "latn",
  }).format(d(value));
}

export function formatDateShort(
  value: string | Date,
  tz: string = DEFAULT_TZ,
): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
    numberingSystem: "latn",
  }).format(d(value));
}

export function formatTime(value: string | Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
    numberingSystem: "latn",
  }).format(d(value));
}

export function formatYear(value: string | Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat(LOCALE, {
    year: "numeric",
    timeZone: tz,
    numberingSystem: "latn",
  }).format(d(value));
}

/** ISO date (YYYY-MM-DD) for <time dateTime>. */
export function isoDate(value: string | Date): string {
  return d(value).toISOString();
}

export function isFuture(value: string | Date): boolean {
  return d(value).getTime() > Date.now();
}
