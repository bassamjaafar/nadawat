/** Small CSV builder — no library needed for this. */
export function toCsv(
  rows: Record<string, string | number | boolean | null>[],
  columns: { key: string; label: string }[],
): string {
  const escape = (v: unknown) => {
    let s = v === null || v === undefined ? "" : String(v);
    // Public free text (names, questions) can start with = + - @ and run as
    // a formula when the file is opened in Excel. A leading apostrophe makes
    // Excel treat it as plain text (and keeps "+963…" phone numbers intact).
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /["\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escape(row[c.key])).join(","),
  );
  // BOM so Excel opens the Arabic text as UTF-8 instead of mangling it.
  return "﻿" + [header, ...lines].join("\r\n");
}
