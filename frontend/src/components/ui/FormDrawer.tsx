import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

export function FormDrawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <aside className="liquid-glass absolute right-0 top-0 h-full w-full max-w-[480px] overflow-y-auto bg-surface p-7 md:p-10" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-grotesk text-2xl text-primary">{title}</h2>
          <button className="btn-secondary !p-3" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}
