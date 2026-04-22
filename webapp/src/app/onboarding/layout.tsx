import { OnboardingSidebar } from "./OnboardingSidebar";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <OnboardingSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
