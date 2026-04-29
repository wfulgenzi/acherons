import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import { loadAdminClinicsListPageData } from "@/server/admin/load-page/load-admin-clinics-list-page";
import { ClinicsTable } from "./ClinicsTable";

export default async function ClinicsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const { rows: data } = await loadAdminClinicsListPageData();

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
