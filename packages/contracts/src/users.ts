import * as v from "valibot";

/** POST `/api/users/:id/membership` */
export const AdminAssignMembershipSchema = v.object({
  orgId: v.pipe(v.string(), v.minLength(1)),
  role: v.optional(v.picklist(["member", "admin"]), "member"),
});

export type AdminAssignMembershipInput = v.InferOutput<
  typeof AdminAssignMembershipSchema
>;

/** POST `/api/users/:id/membership` success */
export type AdminAssignMembershipResponse = {
  ok: true;
};
