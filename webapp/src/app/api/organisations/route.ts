import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organisations, clinicProfiles } from "@/db/schema";
import { requireAdmin, isApiError } from "@/lib/api";
import { CreateOrganisationSchema } from "@/lib/schemas/organisations";
import { formatOrg } from "./helpers";

// ---------------------------------------------------------------------------
// GET /api/organisations — public
// ---------------------------------------------------------------------------

export async function GET() {
  const rows = await db
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .orderBy(organisations.name);

  return NextResponse.json(
    rows.map((r) => formatOrg(r.organisations, r.clinic_profiles))
  );
}

// ---------------------------------------------------------------------------
// POST /api/organisations — admin only
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = v.safeParse(CreateOrganisationSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: v.flatten(result.issues) },
      { status: 400 }
    );
  }

  const {
    name,
    type,
    address,
    latitude,
    longitude,
    phone,
    website,
    mapsUrl,
    specialisations,
    openingHours,
  } = result.output;

  const [org] = await db
    .insert(organisations)
    .values({ name: name.trim(), type })
    .returning();

  let profile: typeof clinicProfiles.$inferSelect | null = null;

  if (type === "clinic") {
    [profile] = await db
      .insert(clinicProfiles)
      .values({
        orgId: org.id,
        address: address ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        phone: phone ?? null,
        website: website ?? null,
        mapsUrl: mapsUrl ?? null,
        specialisations: specialisations ?? null,
        openingHours: openingHours ?? null,
      })
      .returning();
  }

  return NextResponse.json(formatOrg(org, profile), { status: 201 });
}
