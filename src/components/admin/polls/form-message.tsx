import type { FormState } from "@/lib/forms";

/** Success / error line under an admin form, in the site's admin style. */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "error" && state.message) {
    return (
      <p
        role="alert"
        className="rounded-[var(--radius)] border border-[#d8b9ad] bg-[#f3e4de] px-4 py-3 text-[0.9rem] text-[#8f3520]"
      >
        {state.message}
      </p>
    );
  }
  if (state.status === "success" && state.message) {
    return (
      <p
        role="status"
        className="rounded-[var(--radius)] border border-line bg-[#eef2ea] px-4 py-3 text-[0.9rem] text-olive"
      >
        {state.message}
      </p>
    );
  }
  return null;
}
