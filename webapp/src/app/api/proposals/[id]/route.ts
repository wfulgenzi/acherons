import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { proposals, requests, bookings, memberships, organisations } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

const ActionSchema = v.object({
  action: v.picklist(["accept", "refuse"]),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Caller must belong to a dispatcher org
  const memberRows = await db
    .select({ orgId: memberships.orgId, orgType: organisations.type })
    .from(memberships)
    .innerJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, session.user.id))
    .limit(1);

  const membership = memberRows[0];
  if (!membership || membership.orgType !== "dispatch") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const proposalRows = await db
    .select()
    .from(proposals)
    .where(eq(proposals.id, id))
    .limit(1);

  const proposal = proposalRows[0];
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }

  // Ensure this proposal belongs to the caller's dispatcher org
  if (proposal.dispatcherOrgId !== membership.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (proposal.status !== "pending") {
    return NextResponse.json(
      { error: "Proposal is no longer pending." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(ActionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { action } = parsed.output;

  if (action === "refuse") {
    await db
      .update(proposals)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(proposals.id, id));
    return NextResponse.json({ ok: true });
  }

  // Accept: create booking + confirm request
  const slots = proposal.proposedTimeslots;
  if (!slots || slots.length === 0) {
    return NextResponse.json(
      { error: "No timeslots on this proposal." },
      { status: 400 }
    );
  }

  const firstSlot = slots[0];

  await db.insert(bookings).values({
    requestId: proposal.requestId,
    proposalId: proposal.id,
    dispatcherOrgId: proposal.dispatcherOrgId,
    clinicOrgId: proposal.clinicOrgId,
    confirmedStart: new Date(firstSlot.start),
    confirmedEnd: new Date(firstSlot.end),
  });

  await db
    .update(proposals)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(proposals.id, id));

  await db
    .update(requests)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(requests.id, proposal.requestId));

  return NextResponse.json({ ok: true });
}
