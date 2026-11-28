"use client";

import { useActionState, useState } from "react";
import { CheckboxField, SelectField, TextField, TextareaField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/admin/polls/form-message";
import { submitKeepingValues } from "@/components/admin/polls/keep-values";
import { Pill } from "@/components/admin/about/pill";
import { IDLE_FORM_STATE, type FormState } from "@/lib/forms";
import {
  BIO_WORDS_MAX,
  BIO_WORDS_MIN,
  countWords,
  GROUP_STATUS_LABEL,
  missingForPublication,
  renewalState,
  RENEWAL_LABEL,
  type Membership,
  type TeamGroup,
  type TeamMember,
} from "@/lib/about/team";

const STATUS_OPTIONS = [
  { value: "draft", label: "مسودة" },
  { value: "published", label: "منشور" },
  { value: "archived", label: "مؤرشف" },
];

function MembershipsEditor({
  groups,
  rows,
  onChange,
  error,
}: {
  groups: TeamGroup[];
  rows: Membership[];
  onChange: (rows: Membership[]) => void;
  error?: string;
}) {
  const [adding, setAdding] = useState("");
  const byId = new Map(groups.map((g) => [g.id, g]));
  const available = groups.filter(
    (g) => g.status !== "archived" && !rows.some((r) => r.group_id === g.id),
  );

  const update = (i: number, patch: Partial<Membership>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <fieldset className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-line p-4">
      <legend className="px-1 text-meta font-medium text-ink">المجموعات</legend>
      <p className="text-[0.85rem] leading-6 text-muted">
        يمكن أن ينتمي الشخص إلى أكثر من مجموعة. لكلّ عضوية تاريخ بدء وتاريخ انتهاء اختياريان، ولا يظهران للزوار.
      </p>

      {rows.length === 0 ? (
        <p className="text-[0.9rem] text-muted">لم تُضَف أيّ مجموعة بعد.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((r, i) => {
            const g = byId.get(r.group_id);
            const renewal = renewalState(r.end_date);
            return (
              <li key={r.group_id} className="flex flex-col gap-3 border-t border-line pt-4 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-ink">{g?.name_ar ?? "مجموعة محذوفة"}</span>
                  {g && g.status !== "published" ? (
                    <Pill tone="muted">{GROUP_STATUS_LABEL[g.status]}</Pill>
                  ) : null}
                  {renewal !== "none" ? (
                    <Pill tone={renewal === "overdue" ? "bad" : "warn"}>{RENEWAL_LABEL[renewal]}</Pill>
                  ) : null}
                </div>
                <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <TextField
                    id={`ms-start-${r.group_id}`}
                    name=""
                    label="تاريخ البدء"
                    type="date"
                    value={r.start_date ?? ""}
                    onChange={(e) => update(i, { start_date: e.target.value || null })}
                  />
                  <TextField
                    id={`ms-end-${r.group_id}`}
                    name=""
                    label="تاريخ الانتهاء"
                    type="date"
                    value={r.end_date ?? ""}
                    onChange={(e) => update(i, { end_date: e.target.value || null })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(rows.filter((_, j) => j !== i))}
                  >
                    إزالة من المجموعة
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {available.length ? (
        <div className="grid items-end gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_auto]">
          <SelectField
            id="ms-add"
            name=""
            label="إضافة إلى مجموعة"
            options={available.map((g) => ({ value: g.id, label: g.name_ar }))}
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!adding}
            onClick={() => {
              onChange([...rows, { group_id: adding, start_date: null, end_date: null }]);
              setAdding("");
            }}
          >
            إضافة
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-[0.85rem] text-[#a8402a]">{error}</p> : null}
    </fieldset>
  );
}

export function MemberForm({
  member,
  groups,
  action,
  submitLabel,
  isNew = false,
}: {
  member?: TeamMember;
  groups: TeamGroup[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  isNew?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, IDLE_FORM_STATE);
  const [name, setName] = useState(member?.full_name_ar ?? "");
  const [title, setTitle] = useState(member?.title_ar ?? "");
  const [bio, setBio] = useState(member?.bio_ar ?? "");
  const [consent, setConsent] = useState(member?.consent_given ?? false);
  const [rows, setRows] = useState<Membership[]>(member?.memberships ?? []);

  const words = countWords(bio);
  const wordsOk = words >= BIO_WORDS_MIN && words <= BIO_WORDS_MAX;
  const missing = missingForPublication({
    full_name_ar: name,
    title_ar: title,
    bio_ar: bio,
    image_url: member?.image_url ?? null,
    consent_given: consent,
  });

  return (
    <form onSubmit={submitKeepingValues(formAction)} className="flex flex-col gap-6">
      <FormMessage state={state} />

      <TextField
        id="full_name_ar"
        label="الاسم الكامل"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        maxLength={150}
        error={state.errors?.full_name_ar}
      />

      <TextField
        id="title_ar"
        label="الصفة المهنية"
        hint="مثال: باحثة في الاقتصاد السياسي"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        error={state.errors?.title_ar}
      />

      <div className="flex flex-col gap-1.5">
        <TextareaField
          id="bio_ar"
          label="النبذة التعريفية والدافع للمشاركة"
          hint={`تجمع الخلفية المهنية والدافع الشخصي للمساهمة في ندوات. الطول المقترح ${BIO_WORDS_MIN}–${BIO_WORDS_MAX} كلمة.`}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={2000}
          className="[&_textarea]:min-h-[9rem]"
          error={state.errors?.bio_ar}
        />
        <p
          aria-live="polite"
          className={`text-[0.85rem] tabular-nums ${words === 0 || wordsOk ? "text-muted" : "text-[#7a5a14]"}`}
        >
          {words} كلمة
          {words > 0 && words < BIO_WORDS_MIN ? " — أقصر من الطول المقترح" : null}
          {words > BIO_WORDS_MAX ? " — أطول من الطول المقترح" : null}
        </p>
      </div>

      <MembershipsEditor
        groups={groups}
        rows={rows}
        onChange={setRows}
        error={state.errors?.memberships}
      />
      <input type="hidden" name="memberships" value={JSON.stringify(rows)} />

      <div className="flex flex-col gap-1.5">
        <CheckboxField
          id="consent_given"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          error={state.errors?.consent_given}
        >
          تمّت الموافقة على نشر الاسم والصورة والنبذة
        </CheckboxField>
        <p className="ps-8 text-[0.85rem] text-muted">
          {member?.consent_given && member.consent_recorded_at
            ? `سُجّلت الموافقة في ${new Intl.DateTimeFormat("ar-SY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Damascus", numberingSystem: "latn" }).format(new Date(member.consent_recorded_at))}. لا تظهر للزوار.`
            : "يُسجَّل تاريخ الموافقة تلقائيًّا. لا يظهر للزوار."}
        </p>
      </div>

      {isNew ? (
        <>
          <input type="hidden" name="status" value="draft" />
          <p className="rounded-[var(--radius)] border border-line bg-cream-deep px-4 py-3 text-[0.9rem] leading-7 text-muted">
            يُحفظ الملف كمسودة. بعد الحفظ يمكن رفع الصورة الشخصية ثمّ نشر الملف.
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <SelectField
            id="status"
            label="حالة النشر"
            options={STATUS_OPTIONS}
            defaultValue={member?.status ?? "draft"}
            hint="الملف المؤرشف يبقى محفوظًا لكنّه لا يظهر في الصفحة."
            error={state.errors?.status}
          />
          {missing.length ? (
            <p className="text-[0.85rem] leading-6 text-[#7a5a14]">
              لا يمكن النشر بعد. ما زال ناقصًا: {missing.join("، ")}.
            </p>
          ) : (
            <p className="text-[0.85rem] text-olive">البيانات المطلوبة للنشر مكتملة.</p>
          )}
        </div>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
