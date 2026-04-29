import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ExtensionNotificationHint } from "./ExtensionNotificationHint";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const name = session?.user.name || session?.user.email || "there";

  return (
    <div className="flex items-center justify-center min-h-full p-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-10 py-12 max-w-md w-full">
        <p className="text-3xl mb-5">👋</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Hey, {name}!</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Welcome to your Acherons HS dashboard.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed">
          You don&apos;t currently have a project workspace. Ask your workspace
          administrator to add you to the project, or{" "}
          <a
            href="#"
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            contact us
          </a>{" "}
          about creating your project.
        </p>
        <ExtensionNotificationHint />
      </div>
    </div>
  );
}
