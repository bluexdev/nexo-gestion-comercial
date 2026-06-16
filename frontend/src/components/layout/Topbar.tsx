import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/auth';

const names: Record<string, string> = {
  dashboard: 'Dashboard', products: 'Productos', 'purchase-orders': 'Órdenes de compra',
  receipts: 'Ingreso de mercadería', invoices: 'Facturación', dispatch: 'Despacho',
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const location = useLocation();
  const page = names[location.pathname.split('/')[1]] ?? 'Sistema';
  const logout = async () => {
    try { await api.post('/auth/logout'); } finally {
      clearSession();
      window.location.assign('/login');
    }
  };
  return (
    <header className="liquid-glass fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-border px-5 md:left-[240px] md:px-8">
      <div className="flex items-center gap-4">
        <button className="btn-secondary !p-2.5 md:hidden" onClick={onMenu}><Menu size={18} /></button>
        <span className="text-[11px] text-muted">NEXO / {page}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <strong className="block font-grotesk text-[13px] text-primary">{user?.name}</strong>
          <span className="rounded-[28px] border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px] text-accent">{user?.role}</span>
        </div>
        <button className="liquid-glass rounded-[14px] p-3 text-muted" onClick={toggle} aria-label="Cambiar tema">{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button className="liquid-glass rounded-[14px] p-3 text-muted" onClick={logout} aria-label="Cerrar sesión"><LogOut size={17} /></button>
      </div>
    </header>
  );
}
