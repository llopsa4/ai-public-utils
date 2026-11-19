import { useCallback, useEffect, useRef, useState } from 'react';

const FADE_OUT_MS = 160;
const FADE_IN_MS = 220;

// Presentation only: campaign commands still resolve once, at the covered midpoint.
export function useSceneTransition() {
  const [phase, setPhase] = useState<'out' | 'in' | null>(null);
  const locked = useRef(false);
  const pending = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const update = pending.current;
    pending.current = null;
    update?.();
    locked.current = false;
    setPhase(null);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onPreference = () => { if (reduced.matches && locked.current) finish(); };
    const blockInput = (event: Event) => {
      if (!locked.current || (event instanceof KeyboardEvent && !['Enter', ' '].includes(event.key))) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    reduced.addEventListener('change', onPreference);
    document.addEventListener('click', blockInput, true);
    document.addEventListener('keydown', blockInput, true);
    return () => {
      reduced.removeEventListener('change', onPreference);
      document.removeEventListener('click', blockInput, true);
      document.removeEventListener('keydown', blockInput, true);
      if (timer.current) clearTimeout(timer.current);
      pending.current = null;
      locked.current = false;
    };
  }, [finish]);

  const navigate = useCallback((update: () => void) => {
    if (locked.current) return;
    // The player has chosen to leave the dialog; release its top layer before fading.
    document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach(dialog => dialog.close());
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return; }
    locked.current = true;
    pending.current = update;
    setPhase('out');
    timer.current = setTimeout(() => {
      timer.current = null;
      const action = pending.current;
      pending.current = null;
      action?.();
      setPhase('in');
      timer.current = setTimeout(finish, FADE_IN_MS);
    }, FADE_OUT_MS);
  }, [finish]);

  const overlay = phase ? <div className={`scene-transition scene-transition-${phase}`} aria-hidden="true" style={{ animationDuration: `${phase === 'out' ? FADE_OUT_MS : FADE_IN_MS}ms` }} /> : null;
  return { navigate, overlay };
}
