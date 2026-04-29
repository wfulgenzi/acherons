import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { CreateDispatcherRequestSchema } from "@acherons/contracts";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { notifyClinicsRequestCreated } from "@/lib/notifications/emit.server";
import { createDispatcherRequestWithClinics } from "@/server/requests/requests-rls-queries";

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
  const parsed = v.safeParse(CreateDispatcherRequestSchema, body);
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
