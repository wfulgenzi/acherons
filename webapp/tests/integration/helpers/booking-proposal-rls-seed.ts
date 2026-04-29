/**
 * Two clinics + one dispatch org, one request/proposal/booking on clinic1.
 * Used to assert clinic-scoped RLS (bookings + proposals).
 */
import { adminDb } from "@/db";
import {
  bookings,
  memberships,
  organisations,
  proposals,
  requestClinicAccess,
  requests,
  user,
} from "@/db/schema";

export const BOOK_DISPATCH_ORG = "dddddddd-dddd-dddd-dddd-dddddddddddd";
export const BOOK_CLINIC_1_ORG = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
export const BOOK_CLINIC_2_ORG = "ffffffff-ffff-ffff-ffff-ffffffffffff";

export const BOOK_USER_DISPATCH = "rls_book_user_dispatch";
export const BOOK_USER_CLINIC_1 = "rls_book_user_clinic1";
export const BOOK_USER_CLINIC_2 = "rls_book_user_clinic2";

export type BookingProposalFixture = {
  dispatchOrgId: string;
  clinic1Id: string;
  clinic2Id: string;
  userDispatch: string;
  userClinic1: string;
  userClinic2: string;
  requestId: string;
  proposalId: string;
  bookingId: string;
};

export async function seedBookingProposalGraph(): Promise<BookingProposalFixture> {
  const now = new Date();

  await adminDb.insert(organisations).values([
    {
      id: BOOK_DISPATCH_ORG,
      name: "Book test dispatch",
      type: "dispatch",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: BOOK_CLINIC_1_ORG,
      name: "Book test clinic 1",
      type: "clinic",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: BOOK_CLINIC_2_ORG,
      name: "Book test clinic 2",
      type: "clinic",
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await adminDb.insert(user).values([
    {
      id: BOOK_USER_DISPATCH,
      name: "Disp",
      email: "rls-book-disp@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: BOOK_USER_CLINIC_1,
      name: "C1",
      email: "rls-book-c1@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: BOOK_USER_CLINIC_2,
      name: "C2",
      email: "rls-book-c2@example.test",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  ]);

  await adminDb.insert(memberships).values([
    {
      userId: BOOK_USER_DISPATCH,
      orgId: BOOK_DISPATCH_ORG,
      role: "admin",
    },
    {
      userId: BOOK_USER_CLINIC_1,
      orgId: BOOK_CLINIC_1_ORG,
      role: "admin",
    },
    {
      userId: BOOK_USER_CLINIC_2,
      orgId: BOOK_CLINIC_2_ORG,
      role: "admin",
    },
  ]);

  const [reqRow] = await adminDb
    .insert(requests)
    .values({
      dispatcherOrgId: BOOK_DISPATCH_ORG,
      createdByUserId: BOOK_USER_DISPATCH,
      patientGender: "unknown",
      patientAge: 50,
      postcode: "BK1 1AA",
      caseDescription: "Booking/proposal RLS seed",
    })
    .returning({ id: requests.id });

  await adminDb.insert(requestClinicAccess).values({
    requestId: reqRow.id,
    clinicOrgId: BOOK_CLINIC_1_ORG,
    dispatcherOrgId: BOOK_DISPATCH_ORG,
  });

  const slotStart = new Date("2030-06-01T10:00:00.000Z");
  const slotEnd = new Date("2030-06-01T11:00:00.000Z");

  const [propRow] = await adminDb
    .insert(proposals)
    .values({
      requestId: reqRow.id,
      clinicOrgId: BOOK_CLINIC_1_ORG,
      dispatcherOrgId: BOOK_DISPATCH_ORG,
      createdByUserId: BOOK_USER_CLINIC_1,
      status: "pending",
      proposedTimeslots: [{ start: slotStart.toISOString(), end: slotEnd.toISOString() }],
    })
    .returning({ id: proposals.id });

  const confirmedStart = new Date("2030-06-15T14:00:00.000Z");
  const confirmedEnd = new Date("2030-06-15T15:00:00.000Z");

  const [bookRow] = await adminDb
    .insert(bookings)
    .values({
      requestId: reqRow.id,
      proposalId: propRow.id,
      dispatcherOrgId: BOOK_DISPATCH_ORG,
      clinicOrgId: BOOK_CLINIC_1_ORG,
      confirmedStart,
      confirmedEnd,
    })
    .returning({ id: bookings.id });

  return {
    dispatchOrgId: BOOK_DISPATCH_ORG,
    clinic1Id: BOOK_CLINIC_1_ORG,
    clinic2Id: BOOK_CLINIC_2_ORG,
    userDispatch: BOOK_USER_DISPATCH,
    userClinic1: BOOK_USER_CLINIC_1,
    userClinic2: BOOK_USER_CLINIC_2,
    requestId: reqRow.id,
    proposalId: propRow.id,
    bookingId: bookRow.id,
  };
}
