import { CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { SearchSelect } from '../components/ui/SearchSelect';
import { StatusBadge } from '../components/ui/StatusBadge';
import { api, messageFromError } from '../services/api';
import type { PagedResponse, PurchaseOrder } from '../types';

export function ReceiptsPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [orderId, setOrderId] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => orders.find((order) => order.id === orderId), [orders, orderId]);
  const pendingUnits = useMemo(() => orders.reduce((sum, order) => sum + order.details.reduce((lineSum, line) => lineSum + Math.max(0, line.quantity - line.receivedQty), 0), 0), [orders]);
  const selectedPendingUnits = useMemo(() => selected?.details.reduce((sum, line) => sum + Math.max(0, line.quantity - line.receivedQty), 0) ?? 0, [selected]);
  const plannedUnits = useMemo(() => Object.values(quantities).reduce((sum, value) => sum + value, 0), [quantities]);
  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data } = await api.get<PagedResponse<PurchaseOrder>>('/purchase-orders', { params: { status: 'PENDING,PARTIAL', limit: 100 } });
      setOrders(data.data);
    } finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    api.get<PagedResponse<PurchaseOrder>>('/purchase-orders', { params: { status: 'PENDING,PARTIAL', limit: 100 } })
      .then(({ data }) => {
        if (active) setOrders(data.data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);
  const submit = async () => {
    if (!selected) return;
    const details = selected.details.map((line) => ({ purchaseOrderDetailId: line.id, quantity: quantities[line.id] || 0 })).filter((line) => line.quantity > 0);
    setSaving(true);
    try {
      await api.post('/merchandise-receipts', { purchaseOrderId: selected.id, notes, details });
      toast.success('Recepción confirmada', { icon: <CheckCircle2 className="text-accent" size={18} /> });
      setOrderId(''); setNotes(''); await load();
    } catch (error) { toast.error(messageFromError(error)); } finally { setSaving(false); }
  };
  return (
    <section>
      <PageHeader title="INGRESO DE MERCADERÍA" />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard compact loading={loading} value={orders.length} label="OC disponibles" detail="Pendientes o parciales" />
        <MetricCard compact loading={loading} value={pendingUnits} label="Unidades pendientes" detail="En órdenes abiertas" />
        <MetricCard compact loading={loading} value={selectedPendingUnits} label="Pendiente seleccionado" detail={selected?.number ?? 'Sin OC seleccionada'} />
        <MetricCard compact loading={loading} value={plannedUnits} label="Unidades a ingresar" detail="Formulario actual" />
      </div>
      <div className="mx-auto max-w-4xl space-y-6">
        <article className="liquid-glass rounded-[32px] p-6 md:p-8">
          <span className="label">Paso 1 · Seleccionar orden</span>
          {loading ? <div className="skeleton-shimmer h-12 rounded-[14px]" /> : <SearchSelect value={orderId} onChange={(value) => { setOrderId(value); const order = orders.find((item) => item.id === value); setQuantities(Object.fromEntries((order?.details ?? []).map((line) => [line.id, 0]))); }} options={orders.map((order) => ({ value: order.id, label: `${order.number} · ${order.supplier.name}`, meta: order.status }))} placeholder="Buscar OC pendiente" />}
          {selected && <div className="mt-4"><StatusBadge status={selected.status} /></div>}
        </article>
        {selected && <>
          <article className="liquid-glass rounded-[32px] p-6 md:p-8">
            <span className="label">Paso 2 · Cantidades recibidas</span>
            <div className="mt-4 space-y-3">{selected.details.map((line) => {
              const pending = line.quantity - line.receivedQty;
              return <div key={line.id} className="grid items-center gap-3 border-b border-border py-4 md:grid-cols-[1fr_auto_140px]"><div><strong className="text-sm">{line.product.name}</strong><p className="mt-1 text-[11px] text-muted">{line.product.code}</p></div><span className="text-xs text-muted">Esperado {pending}</span><input className="field" type="number" min="0" max={pending} value={quantities[line.id] ?? 0} onChange={(event) => setQuantities((current) => ({ ...current, [line.id]: Math.min(pending, Math.max(0, Number(event.target.value))) }))} /></div>;
            })}</div>
          </article>
          <article className="liquid-glass rounded-[32px] p-6 md:p-8">
            <span className="label">Paso 3 · Resumen</span>
            <p className="mb-5 text-sm text-primary/80">{plannedUnits} unidades por ingresar</p>
            <textarea className="field mb-5 min-h-20" placeholder="Notas de recepción" value={notes} onChange={(event) => setNotes(event.target.value)} />
            <button className="btn-primary w-full" onClick={submit} disabled={saving}>Confirmar recepción</button>
          </article>
        </>}
      </div>
    </section>
  );
}
