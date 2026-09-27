interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '🏔️', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-mist-200 bg-white/60 px-6 py-10 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="font-display text-lg font-semibold text-pine-900">{title}</p>
      {description ? <p className="max-w-xs text-sm text-ink-600">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
