import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { notifyClinicsRequestCreated } from "@/lib/notifications/emit.server";
import { createDispatcherRequestWithClinics } from "@/server/requests/requests-rls-queries";

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

  const newRequest = await createDispatcherRequestWithClinics(
    { userId, orgId: membership.orgId },
    {
      createdByUserId: userId,
      patientGender,
      patientAge,
      postcode,
      caseDescription,
      clinicIds,
    },
  );

  await notifyClinicsRequestCreated(newRequest.id, clinicIds);

  return NextResponse.json({ id: newRequest.id }, { status: 201 });
}
