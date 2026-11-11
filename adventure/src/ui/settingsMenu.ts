// The settings page: text speed, volumes, motion, text size, contrast, quality.
import { TEXT_SCALE, onSettingsChange, settings, updateSettings, type Settings } from '../engine/settings';
import { $, type Ui } from './ui';

export function openSettings(): void {
  const form = $<HTMLFormElement>('settings-form');
  const s = settings();
  (form.elements.namedItem('textSpeed') as RadioNodeList).value = s.textSpeed;
  (form.elements.namedItem('textSize') as RadioNodeList).value = s.textSize;
  (form.elements.namedItem('visualQuality') as RadioNodeList).value = s.visualQuality;
  (form.elements.namedItem('volume') as HTMLInputElement).value = String(s.volume);
  (form.elements.namedItem('musicVolume') as HTMLInputElement).value = String(s.musicVolume);
  for (const k of ['muted', 'reducedMotion', 'highContrast'] as const) (form.elements.namedItem(k) as HTMLInputElement).checked = s[k];
  paintSliders();
  $<HTMLDialogElement>('settings').showModal();
}

/** Ember fill up to each slider's knob (Chromium has no native progress part). */
export function paintSliders(): void {
  for (const r of document.querySelectorAll<HTMLInputElement>('#settings-form input[type="range"]')) {
    r.style.setProperty('--fill', `${Number(r.value) * 100}%`);
  }
}

export function bindSettingsForm(ui: Ui): void {
  const form = $<HTMLFormElement>('settings-form');
  form.addEventListener('input', () => paintSliders());
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', () => {
    const el = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
    updateSettings({
      textSpeed: (form.elements.namedItem('textSpeed') as RadioNodeList).value as Settings['textSpeed'],
      volume: Number(el('volume').value),
      musicVolume: Number(el('musicVolume').value),
      muted: el('muted').checked,
      reducedMotion: el('reducedMotion').checked,
      textSize: (form.elements.namedItem('textSize') as RadioNodeList).value as Settings['textSize'],
      visualQuality: (form.elements.namedItem('visualQuality') as RadioNodeList).value as Settings['visualQuality'],
      highContrast: el('highContrast').checked,
    });
  });
  const apply = (s: Settings) => {
    const root = document.documentElement.classList;
    root.toggle('reduce-motion', s.reducedMotion);
    root.toggle('high-contrast', s.highContrast);
    // The sample line uses the dialogue panel's size for the chosen text size.
    $('settings-sample').style.fontSize = `${Math.round(Math.max(13, 7.5 * ui.zoom) * TEXT_SCALE[s.textSize])}px`;
  };
  onSettingsChange(apply);
  apply(settings());
}
