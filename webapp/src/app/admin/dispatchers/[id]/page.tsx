import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { loadAdminDispatcherDetailPageData } from "@/server/admin/load-page/load-admin-dispatcher-detail-page";
import { OrgMembersTable } from "@/components/OrgMembersTable";

type Props = { params: Promise<{ id: string }> };

export default async function DispatcherDetailPage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const detail = await loadAdminDispatcherDetailPageData(id);

  if (detail.kind === "not_found") {
    notFound();
  }

  const { orgName, orgCreatedAt, members } = detail;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/dispatchers"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Back to dispatchers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">{orgName}</h1>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>
          </div>
          <dl className="divide-y divide-gray-100">
            <InfoRow label="Name" value={orgName} />
            <InfoRow
              label="Created"
              value={orgCreatedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
          </dl>
        </div>

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
