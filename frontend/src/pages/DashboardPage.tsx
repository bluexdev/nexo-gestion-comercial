import { useEffect, useState } from 'react';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/api';
import type { ApiResponse } from '../types';
import { money } from '../utils/format';

type Metrics = {
  totalProducts: number;
  lowStockProducts: number;
  stockoutProducts: number;
  inventoryUnits: number;
  inventoryValue: number;
  pendingOrders: number;
  pendingPurchaseUnits: number;
  pendingPurchaseValue: number;
  invoicesToday: number;
  salesToday: number;
  taxToday: number;
  readyToDispatchInvoices: number;
  pendingDispatches: number;
  dispatchesInTransit: number;
  receiptsToday: number;
  unitsReceivedToday: number;
};

const emptyMetrics: Metrics = {
  totalProducts: 0,
  lowStockProducts: 0,
  stockoutProducts: 0,
  inventoryUnits: 0,
  inventoryValue: 0,
  pendingOrders: 0,
  pendingPurchaseUnits: 0,
  pendingPurchaseValue: 0,
  invoicesToday: 0,
  salesToday: 0,
  taxToday: 0,
  readyToDispatchInvoices: 0,
  pendingDispatches: 0,
  dispatchesInTransit: 0,
  receiptsToday: 0,
  unitsReceivedToday: 0,
};

export function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.get<ApiResponse<Metrics>>('/dashboard/metrics')
      .then(({ data }) => {
        if (!active) return;
        setMetrics(data.data);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError('No se pudieron cargar las métricas del dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const data = metrics ?? emptyMetrics;

  return (
    <section>
      <PageHeader title="ACTIVIDAD HOY" accent="resumen" />
      {error && <div className="mb-5 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-xs text-danger">{error}</div>}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard loading={loading} value={money(data.salesToday)} label="Venta emitida hoy" detail={`IGV ${money(data.taxToday)}`} />
        <MetricCard loading={loading} value={data.pendingPurchaseUnits} label="Unidades por recibir" detail={money(data.pendingPurchaseValue)} />
        <MetricCard loading={loading} value={data.stockoutProducts} label="Productos sin stock" detail={`${data.lowStockProducts} con stock bajo`} />
        <MetricCard loading={loading} value={data.dispatchesInTransit} label="Despachos en ruta" detail={`${data.pendingDispatches} pendientes`} />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="liquid-glass rounded-[32px] p-8 md:p-10">
          <p className="text-[11px] text-muted">Centro de operaciones</p>
          <h2 className="mt-3 max-w-3xl font-grotesk text-3xl leading-tight text-primary md:text-5xl">Control comercial claro, inventario consistente.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <DashboardInlineMetric loading={loading} label="SKUs activos" value={data.totalProducts} />
            <DashboardInlineMetric loading={loading} label="Unidades en almacén" value={data.inventoryUnits} />
            <DashboardInlineMetric loading={loading} label="Valor inventario" value={money(data.inventoryValue)} />
          </div>
          <div className="mt-8 h-1 w-24 rounded-full bg-accent" />
        </div>
        <div className="liquid-glass rounded-[32px] p-8">
          <p className="text-[11px] text-muted">Pulso operativo</p>
          <div className="mt-6 space-y-5">
            <DashboardPulseRow loading={loading} label="Órdenes abiertas" value={data.pendingOrders} />
            <DashboardPulseRow loading={loading} label="Facturas listas para despacho" value={data.readyToDispatchInvoices} />
            <DashboardPulseRow loading={loading} label="Recepciones hoy" value={data.receiptsToday} />
            <DashboardPulseRow loading={loading} label="Unidades recibidas hoy" value={data.unitsReceivedToday} last />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardInlineMetric({ loading, label, value }: { loading: boolean; label: string; value: string | number }) {
  return (
    <div aria-busy={loading}>
      <span className="label">{label}</span>
      {loading ? (
        <div className="skeleton-shimmer h-9 w-28 rounded-xl" />
      ) : (
        <strong className="block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-grotesk text-3xl text-accent" title={String(value)}>{value}</strong>
      )}
    </div>
  );
}

function DashboardPulseRow({ loading, label, value, last = false }: { loading: boolean; label: string; value: string | number; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${last ? '' : 'border-b border-border pb-4'}`} aria-busy={loading}>
      <span>{label}</span>
      {loading ? <div className="skeleton-shimmer h-5 w-12 rounded-full" /> : <strong className="shrink-0 text-accent">{value}</strong>}
    </div>
  );
}
