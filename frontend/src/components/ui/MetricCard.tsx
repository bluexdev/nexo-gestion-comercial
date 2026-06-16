type MetricCardProps = {
  value: string | number;
  label: string;
  detail?: string;
  compact?: boolean;
};

export function MetricCard({ value, label, detail, compact = false }: MetricCardProps) {
  return (
    <article className={`liquid-glass rounded-[28px] ${compact ? 'p-5' : 'p-8'}`}>
      <strong className={`block font-grotesk leading-none text-accent ${compact ? 'text-3xl md:text-4xl' : 'text-6xl md:text-7xl'}`}>{value}</strong>
      <span className="mt-4 block text-[11px] text-muted">{label}</span>
      {detail && <span className="mt-2 block text-xs text-primary/75">{detail}</span>}
    </article>
  );
}
