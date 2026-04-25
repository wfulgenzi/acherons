import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { proposalsRepo, requestsRepo, bookingsRepo } from "@/db/repositories";
import { createInboxNotification } from "@/lib/notifications/emit.server";

type RouteContext = { params: Promise<{ id: string }> };

const ActionSchema = v.object({
  action: v.picklist(["accept", "refuse"]),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(session.user.id);
  if (!membership || membership.orgType !== "dispatch") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(ActionSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const { action } = parsed.output;

  const result = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    async (tx) => {
      const proposal = await proposalsRepo.findById(tx, id);
      if (!proposal) {
        return { error: "Proposal not found.", status: 404 } as const;
      }

      // RLS ensures dispatcher_org_id = app.org_id, but guard explicitly
      if (proposal.dispatcherOrgId !== membership.orgId) {
        return { error: "Forbidden", status: 403 } as const;
      }

      if (proposal.status !== "pending") {
        return {
          error: "Proposal is no longer pending.",
          status: 409,
        } as const;
      }

      if (action === "refuse") {
        await proposalsRepo.refuse(tx, id);
        return {
          outcome: "refused" as const,
          clinicOrgId: proposal.clinicOrgId,
          requestId: proposal.requestId,
          proposalId: proposal.id,
        };
      }

      // Accept: create booking + confirm the request atomically
      const slots = proposal.proposedTimeslots;
      if (!slots || slots.length === 0) {
        return {
          error: "No timeslots on this proposal.",
          status: 400,
        } as const;
      }

      const firstSlot = slots[0];
      const booking = await bookingsRepo.create(tx, {
        requestId: proposal.requestId,
        proposalId: proposal.id,
        dispatcherOrgId: proposal.dispatcherOrgId,
        clinicOrgId: proposal.clinicOrgId,
        confirmedStart: new Date(firstSlot.start),
        confirmedEnd: new Date(firstSlot.end),
      });
      await proposalsRepo.accept(tx, id);
      await requestsRepo.confirm(tx, proposal.requestId);

      return {
        outcome: "accepted" as const,
        clinicOrgId: proposal.clinicOrgId,
        requestId: proposal.requestId,
        bookingId: booking.id,
      };
    },
  );

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  if (result.outcome === "refused") {
    await createInboxNotification(result.clinicOrgId, "proposal.declined", {
      requestId: result.requestId,
      proposalId: result.proposalId,
    });
  } else {
    await createInboxNotification(result.clinicOrgId, "booking.created", {
      requestId: result.requestId,
      bookingId: result.bookingId,
    });
  }

  return NextResponse.json({ ok: true });
}
