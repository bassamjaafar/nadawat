export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  /**
   * What was submitted, echoed back on a validation error so the form can
   * refill itself — React 19 resets uncontrolled fields after every action.
   */
  values?: Record<string, string>;
  /** Only populated in local demo mode (no Resend) so the flow can be tested. */
  devConfirmUrl?: string;
};

export const IDLE_FORM_STATE: FormState = { status: "idle" };
