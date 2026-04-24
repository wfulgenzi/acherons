import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { auth } from "@/lib/auth";
import { withRLS, withUserContext } from "@/db/rls";
import { membershipsRepo, requestsRepo, rcaRepo } from "@/db/repositories";

const CreateRequestSchema = v.object({
  patientGender: v.picklist(["male", "female", "other", "unknown"]),
  patientAge: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(150)),
  postcode: v.pipe(v.string(), v.minLength(1)),
  caseDescription: v.pipe(v.string(), v.minLength(1)),
  clinicIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
});

export async function POST(request: NextRequest) {
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

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(CreateRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { patientGender, patientAge, postcode, caseDescription, clinicIds } = parsed.output;

  const newRequest = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    async (tx) => {
      const req = await requestsRepo.create(tx, {
        dispatcherOrgId: membership.orgId,
        createdByUserId: session.user.id,
        patientGender,
        patientAge,
        postcode,
        caseDescription,
      });
      await rcaRepo.insertMany(tx, req.id, membership.orgId, clinicIds);
      return req;
    }
  );

  return NextResponse.json({ id: newRequest.id }, { status: 201 });
}
