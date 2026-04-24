"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: <DashboardIcon />, exact: true },
  { href: "/admin/clinics", label: "Clinics", icon: <ClinicIcon /> },
  { href: "/admin/dispatchers", label: "Dispatchers", icon: <DispatchIcon /> },
  { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
];

interface AdminSidebarProps {
  userEmail: string;
  userName: string | null;
}

export function AdminSidebar({ userEmail, userName }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string, exact?: boolean) {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const displayName = userName || userEmail;

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-brand-100 border-r border-brand-200 flex flex-col">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-brand-200">
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center">
            <ShieldIcon />
          </span>
          <div className="min-w-0">
            <p className="text-brand-800 font-bold text-base leading-tight tracking-tight truncate">
              Acherons HS
            </p>
            <p className="text-brand-500 text-xs mt-0.5 font-medium tracking-wide uppercase">
              Admin panel
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive(item.href, item.exact)
                ? "bg-brand-600 text-white"
                : "text-brand-500 hover:bg-brand-vivid/10 hover:text-brand-vivid"
            }`}
          >
            <span
              className={
                isActive(item.href, item.exact)
                  ? "text-white/80"
                  : "text-brand-500"
              }
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="border-t border-brand-200 px-4 py-4 space-y-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-200 text-brand-800 text-xs font-semibold flex items-center justify-center shrink-0">
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            {userName && (
              <p className="text-xs font-medium text-brand-800 truncate">
                {userName}
              </p>
            )}
            <p className="text-xs text-brand-500 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-brand-500 hover:text-brand-800 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ClinicIcon() {
  return (
    <svg
      width="16"
      height="16"
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
      width="16"
      height="16"
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

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
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
