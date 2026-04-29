/**
 * Session variables set by {@link withRLS} — shared shape for org-scoped server queries.
 */
export type OrgRlsContext = {
  userId: string;
  orgId: string;
};
