import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { adminDb } from "@/db";
import { requireAdmin, isApiError } from "@/lib/api";
import { UpdateOrganisationSchema } from "@/lib/schemas/organisations";
import { orgsRepo } from "@/db/repositories";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/organisations/:id — public
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const row = await orgsRepo.findById(adminDb, id);

  if (!row) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    orgsRepo.formatOrg(row.organisations, row.clinic_profiles),
  );
}

// ---------------------------------------------------------------------------
// PATCH /api/organisations/:id — admin only
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id } = await params;
  const row = await orgsRepo.findById(adminDb, id);

  if (!row) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = v.safeParse(UpdateOrganisationSchema, body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: v.flatten(result.issues) },
      { status: 400 },
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

  const resolvedType = type ?? row.organisations.type;
  const prevType = row.organisations.type;

  const updatedOrg = await orgsRepo.update(adminDb, id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(type !== undefined && { type }),
  });

  let updatedProfile = null;

  if (resolvedType === "clinic") {
    updatedProfile = await orgsRepo.upsertClinicProfile(
      adminDb,
      id,
      !!row.clinic_profiles,
      {
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
        ...(phone !== undefined && { phone }),
        ...(website !== undefined && { website }),
        ...(mapsUrl !== undefined && { mapsUrl }),
        ...(specialisations !== undefined && { specialisations }),
        ...(openingHours !== undefined && { openingHours }),
      },
    );
  } else if (resolvedType === "dispatch" && prevType === "clinic") {
    await orgsRepo.deleteClinicProfile(adminDb, id);
  }

  return NextResponse.json(orgsRepo.formatOrg(updatedOrg, updatedProfile));
}

// ---------------------------------------------------------------------------
// DELETE /api/organisations/:id — admin only
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) {
    return auth.error;
  }

  const { id } = await params;
  const row = await orgsRepo.findById(adminDb, id);

  if (!row) {
    return NextResponse.json(
      { error: "Organisation not found" },
      { status: 404 },
    );
  }

  await orgsRepo.deleteById(adminDb, id);

  return new NextResponse(null, { status: 204 });
}
