"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const SHARED_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <HomeIcon />, exact: true },
];

const CLINIC_NAV_ITEMS: NavItem[] = [
  { href: "/requests", label: "New Requests", icon: <InboxIcon /> },
  { href: "/proposals", label: "My Proposals", icon: <ProposalsIcon /> },
  { href: "/bookings", label: "Bookings", icon: <CalendarIcon /> },
];
const DISPATCH_NAV_ITEMS: NavItem[] = [
  { href: "/requests/new", label: "New Request", icon: <NewRequestIcon /> },
  { href: "/requests", label: "Open Requests", icon: <ListIcon />, exact: true },
  { href: "/proposals", label: "Proposals", icon: <ProposalsIcon /> },
  { href: "/bookings", label: "Bookings", icon: <CalendarIcon /> },
];

interface SidebarProps {
  orgType: "dispatch" | "clinic";
  orgName: string;
  isAdmin: boolean;
  userEmail: string;
  userName: string | null;
}

export function Sidebar({ orgType, orgName, isAdmin, userEmail, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const typeItems = orgType === "clinic" ? CLINIC_NAV_ITEMS : DISPATCH_NAV_ITEMS;
  const items = [...SHARED_NAV_ITEMS, ...typeItems];

  function isActive(item: NavItem) {
    return item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const displayName = userName || userEmail;
  const portalLabel =
    orgType === "clinic" ? "Practitioner portal" : "Dispatcher portal";

  return (
    <aside className="w-64 shrink-0 min-h-screen bg-brand-100 flex flex-col border-r border-brand-200">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-brand-200">
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center">
            {orgType === "clinic" ? <StethoscopeIcon /> : <HeadphonesIcon />}
          </span>
          <div className="min-w-0">
            <p className="text-brand-800 font-bold text-base leading-tight tracking-tight truncate">
              {orgName}
            </p>
            <p className="text-brand-500 text-xs mt-0.5 font-medium tracking-wide uppercase">{portalLabel}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive(item)
                ? "bg-brand-600 text-white"
                : "text-brand-500 hover:bg-brand-vivid/10 hover:text-brand-vivid"
            }`}
          >
            <span
              className={isActive(item) ? "text-white/80" : "text-brand-500 group-hover:text-brand-vivid"}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom: admin link + user + sign out */}
      <div className="border-t border-brand-200 px-4 py-4 space-y-3">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-medium text-brand-500 hover:text-brand-800 transition-colors px-1"
          >
            <ShieldIcon />
            Admin panel
          </Link>
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-brand-200 text-brand-800 text-xs font-semibold flex items-center justify-center shrink-0">
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            {userName && (
              <p className="text-xs font-medium text-brand-800 truncate">{userName}</p>
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

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function NewRequestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ProposalsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

function StethoscopeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v7a6 6 0 0 0 12 0V3" />
      <path d="M5 3H4" />
      <path d="M19 3h1" />
      <path d="M12 16v3" />
      <circle cx="12" cy="21" r="2" />
    </svg>
  );
}
