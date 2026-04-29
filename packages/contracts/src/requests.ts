import * as v from "valibot";

/** POST `/api/requests` */
export const CreateDispatcherRequestSchema = v.object({
  patientGender: v.picklist(["male", "female", "other", "unknown"]),
  patientAge: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(150)),
  postcode: v.pipe(v.string(), v.minLength(1)),
  caseDescription: v.pipe(v.string(), v.minLength(1)),
  clinicIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
});

export type CreateDispatcherRequestInput = v.InferOutput<
  typeof CreateDispatcherRequestSchema
>;

/** POST `/api/requests` 201 */
export type CreateRequestResponse = {
  id: string;
};

/** PATCH `/api/requests/:id` */
export const PatchDispatcherRequestSchema = v.partial(
  v.object({
    caseDescription: v.pipe(v.string(), v.minLength(1)),
    clinicIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
  }),
);

export type PatchDispatcherRequestInput = v.InferOutput<
  typeof PatchDispatcherRequestSchema
>;

/** PATCH `/api/requests/:id` success */
export type PatchRequestResponse = {
  ok: true;
};
