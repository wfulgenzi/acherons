import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { adminDb, asAdminDb } from "@/db";
import { adminMembershipsRepo, adminOrgsRepo } from "@/db/repositories";
import { ClinicsTable, type ClinicRow } from "./ClinicsTable";

const adb = asAdminDb(adminDb);

export default async function ClinicsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const [rows, memberCounts] = await Promise.all([
    adminOrgsRepo.findAllByType(adb, "clinic"),
    adminMembershipsRepo.memberCountsByOrg(adb),
  ]);

  const countMap = Object.fromEntries(
    memberCounts.map((r) => [r.orgId, r.count]),
  );

  const data: ClinicRow[] = rows.map((r) => ({
    id: r.organisations.id,
    name: r.organisations.name,
    address: r.clinic_profiles?.address ?? null,
    phone: r.clinic_profiles?.phone ?? null,
    specialisations: r.clinic_profiles?.specialisations ?? null,
    memberCount: countMap[r.organisations.id] ?? 0,
    createdAt: r.organisations.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinics</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data.length} total</p>
        </div>
        <Link
          href="/admin/clinics/new"
          className={buttonVariants({ variant: "primary" })}
        >
          + New clinic
        </Link>
      </div>

      <ClinicsTable data={data} />
    </div>
  );
}
