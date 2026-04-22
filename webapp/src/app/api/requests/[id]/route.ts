import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  requests,
  requestClinicAccess,
  memberships,
  organisations,
} from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

const UpdateRequestSchema = v.partial(
  v.object({
    caseDescription: v.pipe(v.string(), v.minLength(1)),
    // Replaces the entire clinic access list when provided
    clinicIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
  })
);

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const requestRows = await db
    .select()
    .from(requests)
    .where(eq(requests.id, id))
    .limit(1);

  const req = requestRows[0];
  if (!req) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (req.dispatcherOrgId !== membership.orgId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(UpdateRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { caseDescription, clinicIds } = parsed.output;

  if (caseDescription !== undefined) {
    await db
      .update(requests)
      .set({ caseDescription, updatedAt: new Date() })
      .where(eq(requests.id, id));
  }

  if (clinicIds !== undefined) {
    // Replace clinic access list atomically
    await db
      .delete(requestClinicAccess)
      .where(eq(requestClinicAccess.requestId, id));
    await db.insert(requestClinicAccess).values(
      clinicIds.map((clinicOrgId) => ({ requestId: id, clinicOrgId }))
    );
  }

  return NextResponse.json({ ok: true });
}
