import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { db } from "@/db";
import { requireAdmin, isApiError } from "@/lib/api";
import { CreateOrganisationSchema } from "@/lib/schemas/organisations";
import { orgsRepo } from "@/db/repositories";

// ---------------------------------------------------------------------------
// GET /api/organisations — public
// ---------------------------------------------------------------------------

export async function GET() {
  const rows = await orgsRepo.findAll(db);
  return NextResponse.json(rows.map((r) => orgsRepo.formatOrg(r.organisations, r.clinic_profiles)));
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

  const { name, type, address, latitude, longitude, phone, website, mapsUrl, specialisations, openingHours } =
    result.output;

  const org = await orgsRepo.create(db, name.trim(), type);

  let profile = null;
  if (type === "clinic") {
    profile = await orgsRepo.upsertClinicProfile(db, org.id, false, {
      address: address ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      phone: phone ?? null,
      website: website ?? null,
      mapsUrl: mapsUrl ?? null,
      specialisations: specialisations ?? null,
      openingHours: openingHours ?? null,
    });
  }

  return NextResponse.json(orgsRepo.formatOrg(org, profile ?? null), { status: 201 });
}
