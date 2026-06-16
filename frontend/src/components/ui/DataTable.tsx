import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import type { ReactNode } from 'react';

export type SortOrder = 'asc' | 'desc';
export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortKey?: string;
};

export function DataTable<T>({ rows, columns, search, onSearch, page, totalPages, onPage, loading = false, empty = 'Sin registros', filters, sortBy, sortOrder, onSort }: {
  rows: T[]; columns: Column<T>[]; search: string; onSearch: (value: string) => void;
  page: number; totalPages: number; onPage: (page: number) => void; loading?: boolean; empty?: string;
  filters?: ReactNode; sortBy?: string; sortOrder?: SortOrder;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
}) {
  const changeSort = (key: string) => {
    onSort?.(key, sortBy === key && sortOrder === 'asc' ? 'desc' : 'asc');
  };
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="liquid-glass flex w-full max-w-sm items-center gap-3 rounded-[14px] px-4 py-3">
          <Search size={16} className="text-muted" />
          <input className="w-full bg-transparent text-xs text-primary outline-none placeholder:text-muted" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="BUSCAR..." />
        </label>
        {filters && <div className="flex flex-wrap items-end gap-3">{filters}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <thead><tr>{columns.map((column) => <th key={column.key} className="border-b border-border px-4 py-4 text-left text-[11px] font-normal text-muted">{column.sortKey && onSort ? <button type="button" className="inline-flex items-center gap-2 transition-colors hover:text-primary" onClick={() => changeSort(column.sortKey!)} aria-label={`Ordenar por ${column.label}`}>{column.label}{sortBy !== column.sortKey ? <ArrowUpDown size={13} /> : sortOrder === 'asc' ? <ArrowUp size={13} className="text-accent" /> : <ArrowDown size={13} className="text-accent" />}</button> : column.label}</th>)}</tr></thead>
          <tbody>
            {!loading && rows.map((row, index) => (
              <tr key={index} className="text-sm text-primary/80 hover:bg-glass">
                {columns.map((column) => <td key={column.key} className="border-b border-border px-4 py-4">{column.render(row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {(loading || !rows.length) && <div className="py-16 text-center text-xs text-muted">{loading ? 'Cargando...' : empty}</div>}
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button className="btn-secondary !p-3" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior"><ChevronLeft size={16} /></button>
        <span className="font-grotesk text-[13px] text-primary">{page} / {Math.max(totalPages, 1)}</span>
        <button className="btn-secondary !p-3" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Página siguiente"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
