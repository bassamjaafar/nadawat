/** Arabic-first date & time formatting. Western digits for legibility in metadata. */

export const DEFAULT_TZ = "Asia/Damascus";

function d(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("ar", {
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
  return new Intl.DateTimeFormat("ar", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: tz,
    numberingSystem: "latn",
  }).format(d(value));
}

export function formatTime(value: string | Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("ar", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
    numberingSystem: "latn",
  }).format(d(value));
}

export function formatYear(value: string | Date, tz: string = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    timeZone: tz,
  }).format(d(value));
}

/** ISO date (YYYY-MM-DD) for <time dateTime>. */
export function isoDate(value: string | Date): string {
  return d(value).toISOString();
}

export function isFuture(value: string | Date): boolean {
  return d(value).getTime() > Date.now();
}
