import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ExtensionAuthError } from "@/lib/extension-auth/errors";
import { createHandoff } from "@/lib/extension-auth/grants.server";
import { isChromiumAppRedirectUrl } from "@/lib/extension-auth/validate-chromium-redirect.server";

type SearchParams = {
  state?: string;
  redirect_uri?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

function buildConnectPath(state: string, redirectUri: string) {
  const p = new URLSearchParams();
  p.set("state", state);
  p.set("redirect_uri", redirectUri);
  return `/extension/connect?${p.toString()}`;
}

function ConnectError({ title, body }: { title: string; body: string }) {
  return (
    <div className="min-h-screen bg-brand-100 flex flex-col">
      <header className="bg-brand-50 border-b border-brand-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="text-lg font-semibold text-brand-800 tracking-tight"
          >
            Acherons HS
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-brand-50 rounded-2xl border border-brand-200 shadow-sm px-8 py-10 text-center">
          <h1 className="text-xl font-bold text-brand-800 mb-2">{title}</h1>
          <p className="text-sm text-brand-600 mb-6">{body}</p>
          <Link
            href="/"
            className="text-sm font-medium text-brand-600 hover:text-brand-vivid"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

function NoOrgMessage() {
  return (
    <div className="min-h-screen bg-brand-100 flex flex-col">
      <header className="bg-brand-50 border-b border-brand-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="text-lg font-semibold text-brand-800 tracking-tight"
          >
            Acherons HS
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-brand-50 rounded-2xl border border-brand-200 shadow-sm px-8 py-10 text-center">
          <h1 className="text-xl font-bold text-brand-800 mb-2">
            Join an organisation first
          </h1>
          <p className="text-sm text-brand-600 mb-6">
            Your account is signed in, but the extension needs an active
            organisation. Complete onboarding in the web app, then return here
            from the extension to finish linking.
          </p>
          <Link
            href="/onboarding"
            className="inline-block text-sm font-semibold text-white bg-brand-600 hover:bg-brand-vivid rounded-lg px-4 py-2.5"
          >
            Open onboarding
          </Link>
        </div>
      </main>
    </div>
  );
}

/**
 * Finishes the Chrome `launchWebAuthFlow` handoff: requires `state` and
 * `redirect_uri` (from `getRedirectURL()`), session cookie, then redirects to
 * the chromiumapp.org URL with `code` and `state` for the extension to
 * exchange via `POST /api/extension/exchange`.
 */
export default async function ExtensionConnectPage({ searchParams }: PageProps) {
  const { state, redirect_uri: redirectUri } = await searchParams;

  if (typeof state !== "string" || !state) {
    return (
      <ConnectError
        title="Missing state"
        body="Open this page from the extension to link your account. The state parameter is required so the sign-in can finish securely."
      />
    );
  }

  if (typeof redirectUri !== "string" || !redirectUri) {
    return (
      <ConnectError
        title="Missing redirect"
        body="The extension should pass redirect_uri (from chrome.identity.getRedirectURL). It is required to send you back to the extension with a one-time code."
      />
    );
  }

  if (!isChromiumAppRedirectUrl(redirectUri)) {
    return (
      <ConnectError
        title="Invalid redirect"
        body="The redirect must be a https URL on *.chromiumapp.org (the Chrome extension redirect used by launchWebAuthFlow)."
      />
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    const connectPath = buildConnectPath(state, redirectUri);
    redirect(`/login?callbackUrl=${encodeURIComponent(connectPath)}`);
  }

  let code: string;
  try {
    const handoff = await createHandoff(session.user.id);
    code = handoff.code;
  } catch (e) {
    if (e instanceof ExtensionAuthError && e.status === 403) {
      return <NoOrgMessage />;
    }
    throw e;
  }

  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  target.searchParams.set("state", state);
  redirect(target.toString());
}
