/**
 * Organisations admin API: same compositions as `/api/organisations` routes.
 */
import { adminDb, asAdminDb } from "@/db";
import { adminOrgsRepo, orgsRepo } from "@/db/repositories";
import type {
  CreateOrganisationInput,
  UpdateOrganisationInput,
} from "@/lib/schemas/organisations";

const adb = asAdminDb(adminDb);

export async function listOrganisationsFormattedForApi() {
  const rows = await adminOrgsRepo.findAll(adb);
  return rows.map((r) =>
    orgsRepo.formatOrg(r.organisations, r.clinic_profiles),
  );
}

export async function getOrganisationFormattedById(id: string) {
  const row = await adminOrgsRepo.findById(adb, id);
  if (!row) {
    return null;
  }
  return orgsRepo.formatOrg(row.organisations, row.clinic_profiles);
}

export async function createOrganisationFromAdminInput(
  input: CreateOrganisationInput,
) {
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
  } = input;

  const org = await adminOrgsRepo.create(adb, name.trim(), type);

  let profile = null;
  if (type === "clinic") {
    profile = await adminOrgsRepo.upsertClinicProfile(adb, org.id, false, {
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

  return orgsRepo.formatOrg(org, profile ?? null);
}

export async function updateOrganisationFromAdminInput(
  id: string,
  input: UpdateOrganisationInput,
): Promise<
  | { ok: false; reason: "not_found" }
  | { ok: true; body: ReturnType<typeof orgsRepo.formatOrg> }
> {
  const row = await adminOrgsRepo.findById(adb, id);
  if (!row) {
    return { ok: false, reason: "not_found" };
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
  } = input;

  const resolvedType = type ?? row.organisations.type;
  const prevType = row.organisations.type;

  const updatedOrg = await adminOrgsRepo.update(adb, id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(type !== undefined && { type }),
  });

  let updatedProfile = null;

  if (resolvedType === "clinic") {
    updatedProfile = await adminOrgsRepo.upsertClinicProfile(
      adb,
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
    await adminOrgsRepo.deleteClinicProfile(adb, id);
  }

  return {
    ok: true,
    body: orgsRepo.formatOrg(updatedOrg, updatedProfile),
  };
}

export async function deleteOrganisationAsAdmin(id: string): Promise<boolean> {
  const row = await adminOrgsRepo.findById(adb, id);
  if (!row) {
    return false;
  }
  await adminOrgsRepo.deleteById(adb, id);
  return true;
}
