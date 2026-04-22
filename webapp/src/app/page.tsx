import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            Acherons HS
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Now in beta
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-6">
            Acherons HS
          </h1>
          <p className="text-xl text-gray-500 leading-relaxed mb-10">
            A clean, simple platform built for your team.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-lg"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors px-6 py-3 rounded-lg border border-gray-200 hover:border-gray-300"
            >
              Log in
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Acherons HS
          </p>
        </div>
      </footer>
    </div>
  );
}
