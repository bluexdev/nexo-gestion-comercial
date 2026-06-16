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
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  useEffect(() => { api.get<ApiResponse<Metrics>>('/dashboard/metrics').then(({ data }) => setMetrics(data.data)); }, []);
  return (
    <section>
      <PageHeader title="ACTIVIDAD HOY" accent="resumen" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard value={money(metrics.salesToday)} label="Venta emitida hoy" detail={`IGV ${money(metrics.taxToday)}`} />
        <MetricCard value={metrics.pendingPurchaseUnits} label="Unidades por recibir" detail={money(metrics.pendingPurchaseValue)} />
        <MetricCard value={metrics.stockoutProducts} label="Productos sin stock" detail={`${metrics.lowStockProducts} con stock bajo`} />
        <MetricCard value={metrics.dispatchesInTransit} label="Despachos en ruta" detail={`${metrics.pendingDispatches} pendientes`} />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="liquid-glass rounded-[32px] p-8 md:p-10">
          <p className="text-[11px] text-muted">Centro de operaciones</p>
          <h2 className="mt-3 max-w-3xl font-grotesk text-3xl leading-tight text-primary md:text-5xl">Control comercial claro, inventario consistente.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div><span className="label">SKUs activos</span><strong className="font-grotesk text-3xl text-accent">{metrics.totalProducts}</strong></div>
            <div><span className="label">Unidades en almacén</span><strong className="font-grotesk text-3xl text-accent">{metrics.inventoryUnits}</strong></div>
            <div><span className="label">Valor inventario</span><strong className="font-grotesk text-3xl text-accent">{money(metrics.inventoryValue)}</strong></div>
          </div>
          <div className="mt-8 h-1 w-24 rounded-full bg-accent" />
        </div>
        <div className="liquid-glass rounded-[32px] p-8">
          <p className="text-[11px] text-muted">Pulso operativo</p>
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4"><span>Órdenes abiertas</span><strong className="text-accent">{metrics.pendingOrders}</strong></div>
            <div className="flex items-center justify-between border-b border-border pb-4"><span>Facturas listas para despacho</span><strong className="text-accent">{metrics.readyToDispatchInvoices}</strong></div>
            <div className="flex items-center justify-between border-b border-border pb-4"><span>Recepciones hoy</span><strong className="text-accent">{metrics.receiptsToday}</strong></div>
            <div className="flex items-center justify-between"><span>Unidades recibidas hoy</span><strong className="text-accent">{metrics.unitsReceivedToday}</strong></div>
          </div>
        </div>
      </div>
    </section>
  );
}
