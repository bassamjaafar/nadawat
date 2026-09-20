/**
 * The admin form's <input type="datetime-local"> has no timezone of its own —
 * we treat whatever the admin types as Damascus wall-clock time (the only
 * timezone this site's events ever run in) and store/display accordingly.
 * Syria has used a fixed UTC+3 offset with no DST since 2022.
 */
const TZ = "Asia/Damascus";
const DAMASCUS_OFFSET = "+03:00";

export function toDamascusInputValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function fromDamascusInputValue(value: string): string | null {
  if (!value) return null;
  return `${value}:00${DAMASCUS_OFFSET}`;
}
