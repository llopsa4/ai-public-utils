// The action ring around a target, and conversation choices.
import { VERB_ICONS } from '../game/assets';
import { t } from '../engine/i18n';
import type { Point, Verb } from '../engine/types';
import { LOGICAL_H, LOGICAL_W, type Ui } from './ui';

export function openRadial(ui: Ui, at: Point, name: string, verbs: Verb[], onPick: (verb: Verb) => void): void {
  closeRadial(ui);
  const ring = ui.radial;
  ring.replaceChildren();
  const backdrop = document.createElement('div');
  backdrop.className = 'radial-backdrop';
  backdrop.addEventListener('pointerdown', e => { e.preventDefault(); closeRadial(ui); });
  backdrop.addEventListener('contextmenu', e => e.preventDefault());
  ring.append(backdrop);

  const button = 44;
  const radius = Math.max(50, verbs.length * 11);
  const stageW = LOGICAL_W * ui.zoom, stageH = LOGICAL_H * ui.zoom;
  const margin = radius + button / 2 + 4;
  const p = ui.toScreen(at);
  const cx = Math.min(Math.max(p.x, margin), stageW - margin);
  const cy = Math.min(Math.max(p.y, margin), stageH - margin);

  const label = document.createElement('div');
  label.className = 'radial-label';
  label.textContent = name;
  label.style.left = `${cx}px`;
  label.style.top = `${cy}px`;

  const buttons = verbs.map((verb, i) => {
    const angle = -Math.PI / 2 + (i / verbs.length) * Math.PI * 2;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'verb';
    b.dataset.verb = verb;
    const action = `${t(`verb.${verb}`)} ${name}`;
    b.setAttribute('aria-label', action);
    b.title = action;
    b.style.left = `${cx + Math.cos(angle) * radius}px`;
    b.style.top = `${cy + Math.sin(angle) * radius}px`;
    b.style.animationDelay = `${i * 18}ms`;
    const img = document.createElement('img');
    img.src = VERB_ICONS[verb];
    img.alt = '';
    b.append(img);
    const show = () => { label.textContent = action; };
    b.addEventListener('pointerenter', show);
    b.addEventListener('focus', show);
    b.addEventListener('pointerleave', () => { label.textContent = name; });
    b.addEventListener('click', () => { closeRadial(ui); onPick(verb); });
    b.addEventListener('keydown', e => {
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
      if (step) { e.preventDefault(); buttons[(i + step + buttons.length) % buttons.length].focus(); }
    });
    return b;
  });
  ring.append(label, ...buttons);
  ring.hidden = false;
  ui.closeRadialHandler = () => { ring.hidden = true; ring.replaceChildren(); };
  buttons[0]?.focus({ preventScroll: true });
}

export function closeRadial(ui: Ui): void {
  const close = ui.closeRadialHandler;
  ui.closeRadialHandler = null;
  close?.();
}

export function choose(ui: Ui, options: string[]): Promise<number> {
  const box = ui.choices;
  box.replaceChildren();
  box.setAttribute('aria-label', t('ui.choices'));
  return new Promise(resolve => {
    const finish = (i: number) => {
      window.removeEventListener('keydown', onKey);
      box.hidden = true;
      box.replaceChildren();
      resolve(i);
    };
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) { e.preventDefault(); finish(n - 1); }
    };
    options.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      const n = document.createElement('span');
      n.className = 'choice-n';
      n.textContent = `${i + 1}`;
      n.setAttribute('aria-hidden', 'true');
      b.append(n, text);
      b.addEventListener('click', () => finish(i));
      box.append(b);
    });
    window.addEventListener('keydown', onKey);
    box.hidden = false;
    (box.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
  });
}
