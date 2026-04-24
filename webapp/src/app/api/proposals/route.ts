import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { requestsRepo, proposalsRepo, rcaRepo } from "@/db/repositories";

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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(session.user.id);
  if (!membership || membership.orgType !== "clinic") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(CreateProposalSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { requestId, proposedTimeslots, notes } = parsed.output;

  const result = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    async (tx) => {
      const req = await requestsRepo.findOpenById(tx, requestId);
      if (!req) return { error: "Request not found or not open.", status: 404 } as const;

      const access = await rcaRepo.findByRequestAndClinic(tx, requestId, membership.orgId);
      if (!access) return { error: "Forbidden", status: 403 } as const;

      const existing = await proposalsRepo.findByRequestAndClinic(tx, requestId, membership.orgId);
      if (existing) {
        return {
          error: "You have already submitted a proposal for this request.",
          status: 409,
        } as const;
      }

      const proposal = await proposalsRepo.create(tx, {
        requestId,
        clinicOrgId: membership.orgId,
        dispatcherOrgId: req.dispatcherOrgId,
        createdByUserId: session.user.id,
        proposedTimeslots,
        notes: notes ?? null,
      });

      return { id: proposal.id } as const;
    }
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ id: result.id }, { status: 201 });
}
