import { eq, and, gte, lt, count } from "drizzle-orm";
import type { Tx } from "../rls";
import { bookings, requests, organisations } from "../schema";

export type NewBooking = {
  requestId: string;
  proposalId: string;
  dispatcherOrgId: string;
  clinicOrgId: string;
  confirmedStart: Date;
  confirmedEnd: Date;
};

/** Clinic: all bookings for their org with request info, ordered by start time. */
export async function findByClinic(tx: Tx, clinicOrgId: string) {
  return tx
    .select({
      id: bookings.id,
      confirmedStart: bookings.confirmedStart,
      confirmedEnd: bookings.confirmedEnd,
      requestId: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
    })
    .from(bookings)
    .innerJoin(requests, eq(requests.id, bookings.requestId))
    .where(eq(bookings.clinicOrgId, clinicOrgId))
    .orderBy(bookings.confirmedStart);
}

/** Dispatcher: all bookings for their org with clinic name + request info, ordered by start time. */
export async function findByDispatcher(tx: Tx, dispatcherOrgId: string) {
  const clinicOrg = organisations;
  return tx
    .select({
      id: bookings.id,
      confirmedStart: bookings.confirmedStart,
      confirmedEnd: bookings.confirmedEnd,
      requestId: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      clinicName: clinicOrg.name,
    })
    .from(bookings)
    .innerJoin(requests, eq(requests.id, bookings.requestId))
    .innerJoin(clinicOrg, eq(clinicOrg.id, bookings.clinicOrgId))
    .where(eq(bookings.dispatcherOrgId, dispatcherOrgId))
    .orderBy(bookings.confirmedStart);
}

/** Clinic dashboard: bookings in a time window with request info. */
export async function findByClinicInWindow(
  tx: Tx,
  clinicOrgId: string,
  from: Date,
  to: Date
) {
  return tx
    .select({ booking: bookings, request: requests })
    .from(bookings)
    .innerJoin(requests, eq(requests.id, bookings.requestId))
    .where(
      and(
        eq(bookings.clinicOrgId, clinicOrgId),
        gte(bookings.confirmedStart, from),
        lt(bookings.confirmedStart, to)
      )
    )
    .orderBy(bookings.confirmedStart);
}

/** Clinic dashboard: count of past bookings in a window (completed count). */
export async function countByClinicInWindow(
  tx: Tx,
  clinicOrgId: string,
  from: Date,
  to: Date
) {
  const [row] = await tx
    .select({ total: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.clinicOrgId, clinicOrgId),
        gte(bookings.confirmedStart, from),
        lt(bookings.confirmedStart, to)
      )
    );
  return row?.total ?? 0;
}

/** Dispatcher dashboard: count of bookings in a time window. */
export async function countByDispatcherInWindow(
  tx: Tx,
  dispatcherOrgId: string,
  from: Date,
  to: Date
) {
  const [row] = await tx
    .select({ total: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.dispatcherOrgId, dispatcherOrgId),
        gte(bookings.confirmedStart, from),
        lt(bookings.confirmedStart, to)
      )
    );
  return row?.total ?? 0;
}

/** Dispatcher dashboard: count of all upcoming bookings (pipeline). */
export async function countUpcomingByDispatcher(tx: Tx, dispatcherOrgId: string, from: Date) {
  const [row] = await tx
    .select({ total: count() })
    .from(bookings)
    .where(and(eq(bookings.dispatcherOrgId, dispatcherOrgId), gte(bookings.confirmedStart, from)));
  return row?.total ?? 0;
}

export async function create(tx: Tx, data: NewBooking) {
  const [row] = await tx.insert(bookings).values(data).returning();
  return row;
}
