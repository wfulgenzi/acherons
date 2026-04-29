import * as v from "valibot";

/** One `[start, end]` pair per slot; times are `HH:MM` strings. */
export type TimeSlot = [string, string];

export type OpeningHoursDay = {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  slots: TimeSlot[];
};

/** Weekly opening pattern (same semantics as JSON stored in `clinic_profiles.opening_hours`). */
export type OpeningHours = OpeningHoursDay[];

const daySchema = v.union([
  v.literal(0),
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
  v.literal(5),
  v.literal(6),
]);

export const openingHoursSchema = v.array(
  v.object({
    day: daySchema,
    slots: v.array(v.tuple([v.string(), v.string()])),
  }),
);
