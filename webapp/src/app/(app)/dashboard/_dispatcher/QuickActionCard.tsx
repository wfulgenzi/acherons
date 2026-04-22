import Link from "next/link";

export function QuickActionCard() {
  return (
    <div className="bg-brand-600 rounded-2xl p-6 flex flex-col gap-4 h-full min-h-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Quick action</h2>
        <button
          className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
          title="More actions"
        >
          <PlusIcon />
        </button>
      </div>

      {/* Prompt */}
      <div className="flex-1">
        <p className="text-sm text-white/80 leading-relaxed">
          A patient just called?
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/requests/new"
        className="w-full flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 transition-colors text-white text-sm font-semibold rounded-xl px-4 py-3 border border-white/20"
      >
        <PlusCircleIcon />
        Create new request
      </Link>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
