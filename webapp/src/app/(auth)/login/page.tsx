"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";

// useSearchParams() must live in a component wrapped by <Suspense>
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: callbackUrl,
    });
    if (error) {
      setError(error.message ?? "Invalid email or password.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await signIn.social({ provider: "google", callbackURL: callbackUrl });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-brand-50 rounded-2xl border border-brand-200 shadow-sm px-8 py-10">
        <h1 className="text-2xl font-bold text-brand-800 mb-1">Welcome back</h1>
        <p className="text-sm text-brand-500 mb-8">
          Log in to your account to continue.
        </p>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 border border-brand-200 rounded-lg px-4 py-2.5 text-sm font-medium text-brand-800 hover:bg-brand-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-6"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-brand-200" />
          <span className="text-xs text-brand-300">or</span>
          <div className="flex-1 h-px bg-brand-200" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-brand-800 mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm text-brand-800 placeholder-brand-300 bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-brand-800 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-brand-200 px-3 py-2.5 text-sm text-brand-800 placeholder-brand-300 bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-vivid disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm text-brand-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-brand-600 hover:text-brand-vivid"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-100 flex flex-col">
      {/* Navbar */}
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
        <Suspense
          fallback={
            <div className="w-full max-w-sm h-96 bg-brand-50 rounded-2xl border border-brand-200 animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
