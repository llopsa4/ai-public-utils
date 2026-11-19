// The action ring around a target, and conversation choices.
import { VERB_ICONS } from '../game/assets';
import { t } from '../engine/i18n';
import type { Point, Verb } from '../engine/types';
import { LOGICAL_H, LOGICAL_W, type Ui } from './ui';

/** How soon a second click on an exit counts as a double-click (as the room's own exit clicks). */
const DOUBLE_CLICK_MS = 400;

export function openRadial(ui: Ui, at: Point, name: string, verbs: Verb[], onPick: (verb: Verb) => void): void {
  closeRadial(ui);
  const ring = ui.radial;
  ring.replaceChildren();
  const backdrop = document.createElement('div');
  backdrop.className = 'radial-backdrop';
  // A quick second click on an exit (a double-click) takes it: the ring opened on the first click
  // covers the stage, so that click lands here, not on the room.
  const opened = performance.now();
  backdrop.addEventListener('pointerdown', e => {
    e.preventDefault();
    closeRadial(ui);
    if (verbs.includes('go') && performance.now() - opened < DOUBLE_CLICK_MS) onPick('go');
  });
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

/** Dialogue replies. With `timeoutMs`, a bar runs down under them and `-1` comes back when it ends. */
export function choose(ui: Ui, options: (string | { text: string; read?: boolean })[], timeoutMs?: number): Promise<number> {
  const box = ui.choices;
  box.replaceChildren();
  box.setAttribute('aria-label', t('ui.choices'));
  return new Promise(resolve => {
    let timer = 0;
    const finish = (i: number) => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
      box.hidden = true;
      box.replaceChildren();
      resolve(i);
    };
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) { e.preventDefault(); finish(n - 1); }
    };
    options.forEach((option, i) => {
      const { text, read } = typeof option === 'string' ? { text: option, read: false } : option;
      const b = document.createElement('button');
      b.type = 'button';
      const n = document.createElement('span');
      n.className = 'choice-n';
      n.textContent = `${i + 1}`;
      n.setAttribute('aria-hidden', 'true');
      b.append(n);
      // A reply drawn from reading the person: the read mark, and its meaning for screen readers.
      if (read) {
        b.classList.add('choice-read');
        const mark = document.createElement('img');
        mark.className = 'choice-mark';
        mark.src = VERB_ICONS.read ?? '';
        mark.alt = t('ui.choiceRead');
        b.append(mark);
      }
      b.append(text);
      b.addEventListener('click', () => finish(i));
      box.append(b);
    });
    if (timeoutMs) {
      const bar = document.createElement('div');
      bar.className = 'choice-timer';
      bar.setAttribute('aria-hidden', 'true');
      bar.style.animationDuration = `${timeoutMs}ms`;
      box.append(bar);
      timer = window.setTimeout(() => finish(-1), timeoutMs);
    }
    window.addEventListener('keydown', onKey);
    box.hidden = false;
    (box.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
  });
}
