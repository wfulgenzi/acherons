import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadAdminDashboardPageData } from "@/server/admin/load-page/load-admin-dashboard-page";

export default async function AdminDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.isAdmin) {
    redirect("/dashboard");
  }

  const { userCount, clinicCount, dispatcherCount } =
    await loadAdminDashboardPageData();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview of your Acherons HS platform
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Users"
          value={userCount}
          href="/admin/users"
          icon={<UsersIcon />}
          color="brand"
        />
        <StatCard
          label="Clinics"
          value={clinicCount}
          href="/admin/clinics"
          icon={<ClinicIcon />}
          color="accent"
        />
        <StatCard
          label="Dispatchers"
          value={dispatcherCount}
          href="/admin/dispatchers"
          icon={<DispatchIcon />}
          color="muted"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

type Color = "brand" | "accent" | "muted";

const colorMap: Record<Color, { icon: string; value: string }> = {
  brand: { icon: "bg-brand-600/10 text-brand-600", value: "text-brand-800" },
  accent: { icon: "bg-brand-200    text-brand-600", value: "text-brand-800" },
  muted: { icon: "bg-brand-200/60 text-brand-500", value: "text-brand-500" },
};

function StatCard({
  label,
  value,
  href,
  icon,
  color,
}: {
  label: string;
  value: number;
  href: string;
  icon: React.ReactNode;
  color: Color;
}) {
  const c = colorMap[color];
  return (
    <a
      href={href}
      className="bg-brand-50 border border-brand-200 rounded-xl p-6 flex items-center gap-5 hover:border-brand-300 hover:shadow-sm transition-all group"
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${c.icon}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className={`text-3xl font-bold mt-0.5 ${c.value}`}>{value}</p>
      </div>
    </a>
  );
}

function UsersIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ClinicIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function DispatchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49" />
      <path d="M7.76 7.76a6 6 0 0 0 0 8.49" />
      <path d="M20.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M3.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}
