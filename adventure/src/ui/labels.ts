// Touch and mobile: full screen, press-and-hold labels for every hotspot.
import type { Point } from '../engine/types';
import { $, type Ui } from './ui';

/** Fullscreen toggle, only where the browser supports it (not on iPhone Safari). */
export function bindFullscreen(): void {
  const button = $<HTMLButtonElement>('fs-btn');
  if (!document.fullscreenEnabled) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  });
  document.addEventListener('fullscreenchange', () => button.setAttribute('aria-pressed', String(!!document.fullscreenElement)));
}

/** Touch: press and hold on the scene to label everything (the touch version of holding Space). */
export function bindLongPress(ui: Ui): void {
  let timer = 0, start: Point | null = null, shown = false;
  const cancel = () => { window.clearTimeout(timer); start = null; };
  ui.stage.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') return;
    start = { x: e.clientX, y: e.clientY };
    timer = window.setTimeout(() => { shown = true; showLabels(ui); }, 450);
  });
  ui.stage.addEventListener('pointermove', e => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) cancel();
  });
  const release = () => {
    cancel();
    if (shown) { shown = false; revealFor(ui, 1500); }
  };
  ui.stage.addEventListener('pointerup', release);
  ui.stage.addEventListener('pointercancel', release);
}

export function showLabels(ui: Ui): void {
  if (ui.host.isBusy()) return;
  const box = ui.labels;
  box.replaceChildren();
  for (const l of ui.host.hotspotLabels()) {
    const el = document.createElement('span');
    el.className = 'label';
    el.textContent = l.text;
    const p = ui.toScreen(l);
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    box.append(el);
  }
  box.hidden = false;
  $('reveal-btn').setAttribute('aria-pressed', 'true');
}

export function hideLabels(ui: Ui): void {
  window.clearTimeout(ui.revealTimer);
  ui.labels.hidden = true;
  $('reveal-btn').setAttribute('aria-pressed', 'false');
}

export function revealFor(ui: Ui, ms: number): void {
  showLabels(ui);
  window.clearTimeout(ui.revealTimer);
  ui.revealTimer = window.setTimeout(() => hideLabels(ui), ms);
}
