import { Boxes, FileText, LayoutDashboard, PackageCheck, ShoppingCart, Truck, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Productos', icon: Boxes },
  { to: '/purchase-orders', label: 'Órdenes de compra', icon: ShoppingCart },
  { to: '/receipts', label: 'Ingreso mercadería', icon: PackageCheck },
  { to: '/invoices', label: 'Facturación', icon: FileText },
  { to: '/dispatch', label: 'Despacho', icon: Truck },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <button className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={onClose} aria-label="Cerrar navegación" />}
      <aside className={`liquid-glass fixed inset-y-0 left-0 z-30 w-[240px] border-r border-border bg-base px-5 py-6 transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-10 flex items-center justify-between px-3">
          <span className="font-grotesk text-lg tracking-wide text-primary">NEXO<span className="text-accent">.</span></span>
          <button className="text-muted md:hidden" onClick={onClose}><X size={20} /></button>
        </div>
        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }, index) => (
            <div key={to}>
              {index === 2 && <div className="my-5 border-t border-border" />}
              <NavLink to={to} onClick={onClose} className={({ isActive }) => `relative flex items-center gap-3 rounded-r-xl px-3 py-3 font-grotesk text-[13px] transition-colors ${isActive ? 'text-primary before:absolute before:-left-2 before:h-6 before:w-0.5 before:bg-accent' : 'text-muted hover:text-primary'}`}>
                <Icon size={17} strokeWidth={1.7} />{label}
              </NavLink>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
