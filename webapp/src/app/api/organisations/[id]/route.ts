import { NextRequest, NextResponse } from "next/server";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organisations, clinicProfiles } from "@/db/schema";
import { requireAdmin, isApiError } from "@/lib/api";
import { UpdateOrganisationSchema } from "@/lib/schemas/organisations";
import { formatOrg, findOrg } from "../helpers";

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/organisations/:id — public
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const row = await findOrg(id);

  if (!row) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  return NextResponse.json(formatOrg(row.organisations, row.clinic_profiles));
}

// ---------------------------------------------------------------------------
// PATCH /api/organisations/:id — admin only
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const { id } = await params;
  const row = await findOrg(id);

  if (!row) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (body === null) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = v.safeParse(UpdateOrganisationSchema, body);
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

  const resolvedType = type ?? row.organisations.type;
  const prevType = row.organisations.type;

  const [updatedOrg] = await db
    .update(organisations)
    .set({
      ...(name !== undefined && { name: name.trim() }),
      ...(type !== undefined && { type }),
      updatedAt: new Date(),
    })
    .where(eq(organisations.id, id))
    .returning();

  let updatedProfile: typeof clinicProfiles.$inferSelect | null = null;

  if (resolvedType === "clinic") {
    const profileUpdates = {
      ...(address !== undefined && { address }),
      ...(latitude !== undefined && { latitude }),
      ...(longitude !== undefined && { longitude }),
      ...(phone !== undefined && { phone }),
      ...(website !== undefined && { website }),
      ...(mapsUrl !== undefined && { mapsUrl }),
      ...(specialisations !== undefined && { specialisations }),
      ...(openingHours !== undefined && { openingHours }),
      updatedAt: new Date(),
    };

    if (row.clinic_profiles) {
      [updatedProfile] = await db
        .update(clinicProfiles)
        .set(profileUpdates)
        .where(eq(clinicProfiles.orgId, id))
        .returning();
    } else {
      [updatedProfile] = await db
        .insert(clinicProfiles)
        .values({ orgId: id, ...profileUpdates })
        .returning();
    }
  } else if (resolvedType === "dispatch" && prevType === "clinic") {
    await db.delete(clinicProfiles).where(eq(clinicProfiles.orgId, id));
  }

  return NextResponse.json(formatOrg(updatedOrg, updatedProfile));
}

// ---------------------------------------------------------------------------
// DELETE /api/organisations/:id — admin only
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const auth = await requireAdmin();
  if (isApiError(auth)) return auth.error;

  const { id } = await params;
  const row = await findOrg(id);

  if (!row) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404 });
  }

  await db.delete(organisations).where(eq(organisations.id, id));

  return new NextResponse(null, { status: 204 });
}
