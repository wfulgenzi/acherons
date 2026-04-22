import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  if (!session.user.isAdmin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-brand-100">
      <AdminSidebar
        userEmail={session.user.email}
        userName={session.user.name ?? null}
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
