import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { withRLS } from "@/db/rls";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { requestsRepo, rcaRepo } from "@/db/repositories";
import { notifyClinicsRequestCreated } from "@/lib/notifications/emit.server";

const CreateRequestSchema = v.object({
  patientGender: v.picklist(["male", "female", "other", "unknown"]),
  patientAge: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(150)),
  postcode: v.pipe(v.string(), v.minLength(1)),
  caseDescription: v.pipe(v.string(), v.minLength(1)),
  clinicIds: v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.minLength(1)),
});

export async function POST(request: NextRequest) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }
  const { userId, membership } = apiAuth;
  if (membership.orgType !== "dispatch") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(CreateRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { patientGender, patientAge, postcode, caseDescription, clinicIds } =
    parsed.output;

  const newRequest = await withRLS(
    { userId, orgId: membership.orgId },
    async (tx) => {
      const req = await requestsRepo.create(tx, {
        dispatcherOrgId: membership.orgId,
        createdByUserId: userId,
        patientGender,
        patientAge,
        postcode,
        caseDescription,
      });
      await rcaRepo.insertMany(tx, req.id, membership.orgId, clinicIds);
      return req;
    },
  );

  await notifyClinicsRequestCreated(newRequest.id, clinicIds);

  return NextResponse.json({ id: newRequest.id }, { status: 201 });
}
