"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export function OnboardingSidebar() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <span className="text-base font-semibold text-gray-900 tracking-tight">
          Acherons HS
        </span>
      </div>

      <div className="flex-1" />

      <div className="border-t border-gray-100 px-4 py-4">
        <button
          onClick={handleSignOut}
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
