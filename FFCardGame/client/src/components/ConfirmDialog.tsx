import { useEffect, useRef, type ReactNode } from 'react';

export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel }: { title: string; children: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => { if (returnFocus.current?.isConnected) returnFocus.current.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby="confirm-title" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id="confirm-title">{title}</h2><div>{children}</div>
    <div className="session-actions"><button className="quiet" autoFocus onClick={onCancel}>Cancel</button><button className="modal-primary" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>;
}
