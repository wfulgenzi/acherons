import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { withRLS, withUserContext } from "@/db/rls";
import { membershipsRepo, requestsRepo, rcaRepo } from "@/db/repositories";

type RouteContext = { params: Promise<{ id: string }> };

const UpdateRequestSchema = v.partial(
  v.object({
    caseDescription: v.pipe(v.string(), v.minLength(1)),
    clinicIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
  })
);

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await withUserContext(session.user.id, (tx) =>
    membershipsRepo.findByUserId(tx, session.user.id)
  );
  if (!membership || membership.orgType !== "dispatch") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(UpdateRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { caseDescription, clinicIds } = parsed.output;

  const found = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    async (tx) => {
      // RLS policy enforces dispatcher_org_id = app.org_id, so this returns
      // null if the request doesn't exist or belongs to another org
      const req = await requestsRepo.findByIdForDispatcher(tx, id, membership.orgId);
      if (!req) return false;

      if (caseDescription !== undefined) {
        await requestsRepo.updateCaseDescription(tx, id, caseDescription);
      }
      if (clinicIds !== undefined) {
        await rcaRepo.replaceAll(tx, id, membership.orgId, clinicIds);
      }
      return true;
    }
  );

  if (!found) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
