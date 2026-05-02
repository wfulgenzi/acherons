import { InlineSpinner } from "./InlineSpinner";

type Props = {
  /** Short status line under the spinner */
  label?: string;
  /** Grow to fill flex parent (panel body / popup gate) */
  fill?: boolean;
};

/** Centered spinner + optional label for popup and clinic panels */
export function LoadingPlaceholder({ label, fill }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-center ${fill ? "min-h-0 flex-1 py-6" : "py-10"}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex items-center justify-center">
        <span
          className="absolute h-14 w-14 rounded-full bg-brand-400/15 blur-lg"
          aria-hidden
        />
        <span className="relative rounded-full border border-brand-200/80 bg-white/90 p-2.5 shadow-sm ring-1 ring-brand-100">
          <InlineSpinner size="lg" className="text-brand-600" />
        </span>
      </div>
      {label ? (
        <p className="max-w-[14rem] text-[13px] font-medium leading-snug tracking-tight text-gray-600">
          {label}
        </p>
      ) : null}
    </div>
  );
}
