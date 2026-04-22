import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { requests, requestClinicAccess, memberships, organisations } from "@/db/schema";

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

  // Verify the user belongs to a dispatcher org
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

  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(CreateRequestSchema, body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { patientGender, patientAge, postcode, caseDescription, clinicIds } =
    parsed.output;

  const [newRequest] = await db
    .insert(requests)
    .values({
      dispatcherOrgId: membership.orgId,
      createdByUserId: session.user.id,
      patientGender,
      patientAge,
      postcode,
      caseDescription,
      status: "open",
    })
    .returning();

  if (clinicIds.length > 0) {
    await db.insert(requestClinicAccess).values(
      clinicIds.map((clinicOrgId) => ({
        requestId: newRequest.id,
        clinicOrgId,
      }))
    );
  }

  return NextResponse.json({ id: newRequest.id }, { status: 201 });
}
