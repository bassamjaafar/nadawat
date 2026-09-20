import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

const controlBase =
  "w-full rounded-[var(--radius)] border bg-[#fffdf7] px-3.5 py-2.5 text-[1rem] text-ink " +
  "placeholder:text-muted/60 transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-olive " +
  "aria-[invalid=true]:border-[#a8402a] border-line-strong";

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-meta font-medium text-ink">
      {children}
      {optional ? (
        <span className="ms-1 font-normal text-muted">(اختياري)</span>
      ) : null}
    </label>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="text-[0.85rem] text-[#a8402a]">
      {children}
    </p>
  );
}

export function TextField({
  id,
  label,
  error,
  optional,
  hint,
  className,
  ...props
}: ComponentPropsWithoutRef<"input"> & {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      {hint ? (
        <p id={hintId} className="text-[0.85rem] text-muted">
          {hint}
        </p>
      ) : null}
      <input
        id={id}
        name={id}
        className={controlBase}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        {...props}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export function TextareaField({
  id,
  label,
  error,
  optional,
  hint,
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea"> & {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} optional={optional}>
        {label}
      </Label>
      {hint ? (
        <p id={hintId} className="text-[0.85rem] text-muted">
          {hint}
        </p>
      ) : null}
      <textarea
        id={id}
        name={id}
        className={cn(controlBase, "min-h-[7rem] resize-y")}
        aria-invalid={error ? true : undefined}
        aria-describedby={cn(error && errorId, hint && hintId) || undefined}
        {...props}
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export function SelectField({
  id,
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}: ComponentPropsWithoutRef<"select"> & {
  id: string;
  label: string;
  error?: string;
  options: string[] | { value: string; label: string }[];
  placeholder?: string;
}) {
  const errorId = `${id}-error`;
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={id}
        className={cn(controlBase, "appearance-none bg-[length:1rem] pe-3")}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        defaultValue=""
        {...props}
      >
        <option value="" disabled>
          {placeholder ?? "اختر…"}
        </option>
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

export function CheckboxField({
  id,
  children,
  error,
  ...props
}: ComponentPropsWithoutRef<"input"> & {
  id: string;
  children: ReactNode;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={id}
          type="checkbox"
          className="mt-1 size-[1.15rem] shrink-0 rounded-[3px] border border-line-strong accent-olive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <label htmlFor={id} className="text-[0.95rem] leading-7 text-ink">
          {children}
        </label>
      </div>
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

/** Anti-spam field, visually and semantically hidden from people. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="company">لا تملأ هذا الحقل</label>
      <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
