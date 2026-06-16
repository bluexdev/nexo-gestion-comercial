const success = ['ACTIVO', 'RECEIVED', 'DELIVERED', 'PAID'];
const danger = ['CANCELADO', 'CANCELLED', 'RETURNED', 'INACTIVO'];
const warning = ['PARTIAL'];

export function StatusBadge({ status }: { status: string }) {
  const className = success.includes(status)
    ? 'text-success bg-[color-mix(in_srgb,var(--success)_12%,transparent)]'
    : danger.includes(status)
      ? 'text-danger bg-[color-mix(in_srgb,var(--danger)_10%,transparent)]'
      : warning.includes(status)
        ? 'text-warning bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]'
        : 'text-muted bg-glass';
  return <span className={`inline-flex rounded-[28px] px-3 py-1 font-mono text-[11px] ${className}`}>{status}</span>;
}
