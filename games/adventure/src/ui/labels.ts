// Fullscreen and keyboard/button labels for every hotspot.
import { $, type Ui } from './ui';
import { placeLabels } from './labelLayout';

/** Fullscreen toggle, only where the browser supports it. */
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

export function showLabels(ui: Ui): void {
  if (ui.host.isBusy()) return;
  const box = ui.labels;
  box.replaceChildren();
  box.hidden = false;
  const targets = ui.host.hotspotLabels().map(l => ({ ...ui.toScreen(l), text: l.text }));
  const width = ui.stage.clientWidth, height = ui.stage.clientHeight;
  const labels = targets.map(l => {
    const el = document.createElement('span');
    el.className = 'label';
    el.textContent = l.text;
    el.style.maxWidth = `${Math.max(1, Math.min(220, width - 8))}px`;
    box.append(el);
    return el;
  });
  const layout = placeLabels(labels.map((el, i) => ({ ...targets[i], width: el.offsetWidth, height: el.offsetHeight })), { width, height });
  const wires = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wires.classList.add('label-connectors');
  wires.setAttribute('width', String(width));
  wires.setAttribute('height', String(height));
  wires.setAttribute('aria-hidden', 'true');
  box.prepend(wires);
  layout.forEach((rect, i) => {
    labels[i].style.left = `${rect.x}px`;
    labels[i].style.top = `${rect.y}px`;
    if (!rect.displaced) return;
    const target = targets[i];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    for (const [name, value] of Object.entries({ x1: target.x, y1: target.y,
      x2: Math.max(rect.x, Math.min(target.x, rect.x + rect.width)),
      y2: Math.max(rect.y, Math.min(target.y, rect.y + rect.height)) })) line.setAttribute(name, String(value));
    wires.append(line);
  });
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
