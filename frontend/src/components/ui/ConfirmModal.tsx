import { useEffect } from 'react';

export function ConfirmModal({ open, title, message, onConfirm, onClose }: { open: boolean; title: string; message: string; onConfirm: () => void; onClose: () => void }) {
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
    <div className="modal-overlay fixed inset-0 z-40 flex items-center justify-center p-5 backdrop-blur-lg" role="presentation" onMouseDown={onClose}>
      <div className="liquid-glass w-full max-w-[440px] rounded-[32px] p-10" role="alertdialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <h2 className="font-grotesk text-xl text-primary">{title}</h2>
        <p className="my-6 text-[13px] leading-6 text-muted">{message}</p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="rounded-[14px] bg-danger px-6 py-3 font-grotesk text-[13px] text-white" onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
