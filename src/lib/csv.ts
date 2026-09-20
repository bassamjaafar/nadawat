/** Small CSV builder — no library needed for this. */
export function toCsv(
  rows: Record<string, string | number | boolean | null>[],
  columns: { key: string; label: string }[],
): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escape(row[c.key])).join(","),
  );
  // BOM so Excel opens the Arabic text as UTF-8 instead of mangling it.
  return "﻿" + [header, ...lines].join("\r\n");
}
