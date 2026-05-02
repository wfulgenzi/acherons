type Props = {
  error: unknown;
  onRetry: () => void;
};

export function QueryErrorPanel({ error, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-red-700">
        {error instanceof Error ? error.message : "Unknown error."}
      </p>
      <button
        type="button"
        className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-vivid"
        onClick={() => {
          void onRetry();
        }}
      >
        Retry
      </button>
    </div>
  );
}
