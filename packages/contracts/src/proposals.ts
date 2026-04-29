import * as v from "valibot";

const TimeslotSchema = v.object({
  start: v.pipe(v.string(), v.minLength(1)),
  end: v.pipe(v.string(), v.minLength(1)),
});

/** POST `/api/proposals` */
export const CreateProposalSchema = v.object({
  requestId: v.pipe(v.string(), v.uuid()),
  proposedTimeslots: v.pipe(v.array(TimeslotSchema), v.minLength(1)),
  notes: v.optional(v.string()),
});

export type CreateProposalInput = v.InferOutput<typeof CreateProposalSchema>;

/** POST `/api/proposals` 201 */
export type CreateProposalResponse = {
  id: string;
};

/** PATCH `/api/proposals/:id` */
export const PatchProposalActionSchema = v.object({
  action: v.picklist(["accept", "refuse"]),
});

export type PatchProposalActionInput = v.InferOutput<
  typeof PatchProposalActionSchema
>;

/** PATCH `/api/proposals/:id` success */
export type PatchProposalResponse = {
  ok: true;
};
