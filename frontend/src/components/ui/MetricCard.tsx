type MetricCardProps = {
  value: string | number;
  label: string;
  detail?: string;
  compact?: boolean;
  loading?: boolean;
};

export function MetricCard({ value, label, detail, compact = false, loading = false }: MetricCardProps) {
  if (loading) {
    return (
      <article className={`liquid-glass rounded-[28px] ${compact ? 'p-5' : 'p-8'}`} aria-busy="true">
        <div className={`skeleton-shimmer rounded-xl ${compact ? 'h-9 w-28 md:h-11' : 'h-12 w-36 md:h-16 md:w-44'}`} />
        <div className="skeleton-shimmer mt-5 h-3 w-32 rounded-full" />
        <div className="skeleton-shimmer mt-3 h-3 w-24 rounded-full opacity-70" />
      </article>
    );
  }

  return (
    <article className={`liquid-glass min-w-0 rounded-[28px] ${compact ? 'p-5' : 'p-8'}`}>
      <strong
        className={`block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-grotesk leading-none tracking-tight text-accent ${compact ? 'text-3xl md:text-4xl' : 'text-[clamp(2.55rem,5vw,4.75rem)]'}`}
        title={String(value)}
      >
        {value}
      </strong>
      <span className="mt-4 block text-[11px] text-muted">{label}</span>
      {detail && <span className="mt-2 block text-xs text-primary/75">{detail}</span>}
    </article>
  );
}
