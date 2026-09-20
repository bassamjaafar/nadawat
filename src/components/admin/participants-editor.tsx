"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Person } from "@/lib/types";
import { createPersonAction, saveParticipantsAction } from "@/app/admin/(protected)/events/actions";

type SpeakerRow = { key: string; personId: string; positionLabel: string };

export function ParticipantsEditor({
  debateId,
  allPeople,
  initialModeratorId,
  initialSpeakers,
}: {
  debateId: string;
  allPeople: Person[];
  initialModeratorId: string | null;
  initialSpeakers: { personId: string; positionLabel: string | null }[];
}) {
  const [people, setPeople] = useState(allPeople);
  const [moderatorId, setModeratorId] = useState(initialModeratorId ?? "");
  const [speakers, setSpeakers] = useState<SpeakerRow[]>(
    initialSpeakers.map((s, i) => ({
      key: `${s.personId}-${i}`,
      personId: s.personId,
      positionLabel: s.positionLabel ?? "",
    })),
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [newPersonOpen, setNewPersonOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState("");
  const [newPersonTitle, setNewPersonTitle] = useState("");
  const [newPersonPending, setNewPersonPending] = useState(false);
  const [newPersonError, setNewPersonError] = useState<string | null>(null);

  function addSpeakerRow() {
    setSpeakers((rows) => [
      ...rows,
      { key: crypto.randomUUID(), personId: "", positionLabel: "" },
    ]);
  }

  function removeSpeakerRow(key: string) {
    setSpeakers((rows) => rows.filter((r) => r.key !== key));
  }

  function updateSpeaker(key: string, patch: Partial<SpeakerRow>) {
    setSpeakers((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  async function handleCreatePerson() {
    setNewPersonError(null);
    if (!newPersonName.trim()) {
      setNewPersonError("اسم الشخص مطلوب.");
      return;
    }
    setNewPersonPending(true);
    const result = await createPersonAction({
      name_ar: newPersonName,
      title_ar: newPersonTitle,
      bio_ar: "",
    });
    setNewPersonPending(false);
    if ("error" in result) {
      setNewPersonError(result.error);
      return;
    }
    setPeople((p) => [...p, result.person].sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar")));
    setNewPersonName("");
    setNewPersonTitle("");
    setNewPersonOpen(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    const result = await saveParticipantsAction(debateId, {
      moderatorId: moderatorId || null,
      speakers: speakers
        .filter((s) => s.personId)
        .map((s) => ({
          personId: s.personId,
          positionLabel: s.positionLabel.trim() || null,
        })),
    });
    setSaving(false);
    if ("error" in result) {
      setSaveError(result.error);
      return;
    }
    setSaved(true);
  }

  const moderatorSelectId = useId();

  return (
    <div className="flex flex-col gap-6">
      {saveError ? (
        <p
          role="alert"
          className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
        >
          {saveError}
        </p>
      ) : null}
      {saved ? (
        <p
          role="status"
          className="rounded-[var(--radius)] border border-line bg-[#eef2ea] px-4 py-3 text-[0.9rem] text-olive"
        >
          تمّ الحفظ.
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor={moderatorSelectId} className="text-meta font-medium text-ink">
          المحاور
        </label>
        <select
          id={moderatorSelectId}
          value={moderatorId}
          onChange={(e) => setModeratorId(e.target.value)}
          className="w-full rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3.5 py-2.5 text-[1rem] text-ink"
        >
          <option value="">بلا محاور</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-meta font-medium text-ink">الضيوف</p>
        {speakers.length === 0 ? (
          <p className="text-[0.9rem] text-muted">لا يوجد ضيوف بعد.</p>
        ) : (
          speakers.map((row) => (
            <div
              key={row.key}
              className="grid gap-3 rounded-[var(--radius)] border border-line p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <select
                value={row.personId}
                onChange={(e) => updateSpeaker(row.key, { personId: e.target.value })}
                className="w-full rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3.5 py-2.5 text-[0.95rem] text-ink"
              >
                <option value="" disabled>
                  اختر شخصًا
                </option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_ar}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="الموقف، مثل: مع توسيع الصلاحيات المحلية"
                value={row.positionLabel}
                onChange={(e) =>
                  updateSpeaker(row.key, { positionLabel: e.target.value })
                }
                className="w-full rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3.5 py-2.5 text-[0.95rem] text-ink"
              />
              <button
                type="button"
                onClick={() => removeSpeakerRow(row.key)}
                className="justify-self-start text-[0.85rem] text-[#8f3520] hover:underline sm:justify-self-center"
              >
                إزالة
              </button>
            </div>
          ))
        )}
        <div>
          <Button type="button" variant="outline" size="sm" onClick={addSpeakerRow}>
            + إضافة ضيف
          </Button>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-line p-4">
        {newPersonOpen ? (
          <div className="flex flex-col gap-3">
            {newPersonError ? (
              <p className="text-[0.85rem] text-[#8f3520]">{newPersonError}</p>
            ) : null}
            <input
              type="text"
              placeholder="الاسم الكامل"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3.5 py-2.5 text-[0.95rem] text-ink"
            />
            <input
              type="text"
              placeholder="الصفة (اختياري)، مثل: أستاذة اقتصاد سياسي"
              value={newPersonTitle}
              onChange={(e) => setNewPersonTitle(e.target.value)}
              className="w-full rounded-[var(--radius)] border border-line-strong bg-[#fffdf7] px-3.5 py-2.5 text-[0.95rem] text-ink"
            />
            <div className="flex gap-3">
              <Button
                type="button"
                size="sm"
                disabled={newPersonPending}
                onClick={handleCreatePerson}
              >
                {newPersonPending ? "جارٍ الإضافة…" : "إضافة الشخص"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setNewPersonOpen(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setNewPersonOpen(true)}
            className="text-[0.9rem] text-olive hover:underline"
          >
            الشخص غير موجود في القائمة؟ أضِف شخصًا جديدًا
          </button>
        )}
      </div>

      <div>
        <Button type="button" disabled={saving} onClick={handleSave}>
          {saving ? "جارٍ الحفظ…" : "حفظ الضيوف والمحاور"}
        </Button>
      </div>
    </div>
  );
}
