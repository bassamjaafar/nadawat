import { startTransition, type FormEvent } from "react";

/**
 * Submits a form to a useActionState action without React's automatic
 * form reset, so after an error (a short reason, a refused status change)
 * everything typed or ticked is still there. `confirmText` asks first.
 */
export function submitKeepingValues(
  formAction: (formData: FormData) => void,
  confirmText?: string | (() => string | null),
) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = typeof confirmText === "function" ? confirmText() : confirmText;
    if (text && !confirm(text)) return;
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };
}
