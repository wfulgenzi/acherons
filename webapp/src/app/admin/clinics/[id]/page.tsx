import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadAdminClinicDetailPageData } from "@/server/admin/load-page/load-admin-clinic-detail-page";
import { OrgMembersTable } from "@/components/OrgMembersTable";

type Props = { params: Promise<{ id: string }> };

export default async function ClinicDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const detail = await loadAdminClinicDetailPageData(id);

  if (detail.kind === "not_found") {
    notFound();
  }

  const { orgName, orgCreatedAt, profile, members } = detail;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/clinics"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to clinics
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">{orgName}</h1>
      </div>

      <div className="space-y-4">
        <InfoCard title="Details">
          <InfoRow label="Name" value={orgName} />
          <InfoRow
            label="Created"
            value={orgCreatedAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
        </InfoCard>

        <InfoCard title="Clinic information">
          <InfoRow label="Address" value={profile?.address} />
          <InfoRow label="Phone" value={profile?.phone} />
          <InfoRow label="Website" value={profile?.website} />
          <InfoRow label="Google Maps" value={profile?.mapsUrl} />
          <InfoRow
            label="Specialisations"
            value={
              profile?.specialisations?.length
                ? profile.specialisations.join(", ")
                : null
            }
          />
        </InfoCard>

        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Members
            <span className="ml-2 text-xs font-normal text-gray-500">
              {members.length} total
            </span>
          </h2>
          <OrgMembersTable data={members} />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <dl className="divide-y divide-gray-100">{children}</dl>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex px-5 py-3.5 gap-4">
      <dt className="text-sm text-gray-500 w-36 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 font-medium">
        {value ?? <span className="text-gray-400 font-normal">—</span>}
      </dd>
    </div>
  );
}
