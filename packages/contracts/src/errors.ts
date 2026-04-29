/** Generic JSON error body used by many routes */
export type ApiErrorBody = {
  error: string;
};

/** Validation failure payload shape for routes that use `v.flatten` */
export type ApiValidationErrorBody = {
  error: string;
  issues: unknown;
};
