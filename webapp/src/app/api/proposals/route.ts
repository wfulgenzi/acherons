import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  proposals,
  requests,
  requestClinicAccess,
  memberships,
  organisations,
} from "@/db/schema";

const TimeslotSchema = v.object({
  start: v.pipe(v.string(), v.minLength(1)),
  end: v.pipe(v.string(), v.minLength(1)),
});

const CreateProposalSchema = v.object({
  requestId: v.pipe(v.string(), v.uuid()),
  proposedTimeslots: v.pipe(v.array(TimeslotSchema), v.minLength(1)),
  notes: v.optional(v.string()),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Caller must belong to a clinic org
  const memberRows = await db
    .select({ orgId: memberships.orgId, orgType: organisations.type })
    .from(memberships)
    .innerJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  const membership = memberRows[0];
  if (!membership || membership.orgType !== "clinic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(CreateProposalSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { requestId, proposedTimeslots, notes } = parsed.output;

  // Ensure the request exists and is open
  const [req] = await db
    .select()
    .from(requests)
    .where(and(eq(requests.id, requestId), eq(requests.status, "open")))
    .limit(1);

  if (!req) {
    return NextResponse.json({ error: "Request not found or not open." }, { status: 404 });
  }

  // Ensure this clinic has been granted access to this request
  const [access] = await db
    .select()
    .from(requestClinicAccess)
    .where(
      and(
        eq(requestClinicAccess.requestId, requestId),
        eq(requestClinicAccess.clinicOrgId, membership.orgId)
      )
    )
    .limit(1);

  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent duplicate proposals from the same clinic
  const [existing] = await db
    .select({ id: proposals.id })
    .from(proposals)
    .where(
      and(
        eq(proposals.requestId, requestId),
        eq(proposals.clinicOrgId, membership.orgId)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "You have already submitted a proposal for this request." },
      { status: 409 }
    );
  }

  const [newProposal] = await db
    .insert(proposals)
    .values({
      requestId,
      clinicOrgId: membership.orgId,
      dispatcherOrgId: req.dispatcherOrgId,
      createdByUserId: session.user.id,
      proposedTimeslots,
      notes: notes ?? null,
      status: "pending",
    })
    .returning();

  return NextResponse.json({ id: newProposal.id }, { status: 201 });
}
