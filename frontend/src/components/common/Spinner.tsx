export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-ink-600">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-mist-200 border-t-pine-700" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
