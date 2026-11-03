// Speech: the dialogue panel, typewriter text, portrait mouth flaps and moods.
import { PORTRAITS, PORTRAIT_MOODS, type Mood } from '../game/assets';
import { t } from '../engine/i18n';
import { lineDuration, settings } from '../engine/settings';
import type { Point, Speaker } from '../engine/types';
import { $, FLAP_MS, FLAP_PER_CHAR, SPEECH_COLORS, type Ui } from './ui';

/**
 * Shows a spoken line in the dialogue panel (portrait, name, text; Mara on the left, others on
 * the right) and resolves when its time is up or the player clicks. With auto-advance off, only
 * a click moves on.
 */
export function say(ui: Ui, actor: Speaker, text: string, _at: Point, mood: Mood = 'neutral'): Promise<void> {
  ui.skipSpeech?.();
  const panel = ui.dialogue;
  const stopFlap = showPortrait(actor === 'hero' ? 'mara' : actor, mood, text.length);
  const name = $('dialogue-name');
  name.textContent = t(`speaker.${actor}`);
  name.style.color = SPEECH_COLORS[actor];
  $('dialogue-line').textContent = text;
  panel.style.borderColor = SPEECH_COLORS[actor];
  panel.classList.toggle('right', actor !== 'hero');
  const s = settings();
  $('dialogue-more').hidden = s.autoAdvance;
  panel.hidden = false;
  ui.live.textContent = `${t(`speaker.${actor}`)}: ${text}`;
  ui.history.push({ actor, text });
  return new Promise(resolve => {
    const done = () => {
      window.clearTimeout(timer);
      stopFlap();
      if (ui.skipSpeech === done) { ui.skipSpeech = null; panel.hidden = true; }
      resolve();
    };
    const timer = s.autoAdvance ? window.setTimeout(done, lineDuration(text, s.textSpeed)) : 0;
    ui.skipSpeech = done;
  });
}

/**
 * Shows the speaker's portrait strip at the mood's frame and flaps the mouth for a while
 * (not with reduced motion). Returns a function that stops the flapping.
 */
export function showPortrait(sheet: string, mood: Mood, chars: number): () => void {
  const el = $('dialogue-portrait');
  const url = PORTRAITS[sheet];
  el.hidden = !url;
  if (!url) return () => {};
  const moods = PORTRAIT_MOODS[sheet] ?? ['neutral'];
  const frames = moods.length * 2;
  const base = Math.max(0, moods.indexOf(mood)) * 2;
  const show = (open: boolean) => {
    el.style.backgroundPositionX = `${((base + (open ? 1 : 0)) / (frames - 1)) * 100}%`;
  };
  el.style.backgroundImage = `url("${url}")`;
  el.style.backgroundSize = `${frames * 100}% 100%`;
  show(false);
  if (settings().reducedMotion) return () => {};
  let open = false;
  const flap = window.setInterval(() => { open = !open; show(open); }, FLAP_MS);
  const stop = window.setTimeout(() => { window.clearInterval(flap); show(false); }, Math.max(500, chars * FLAP_PER_CHAR));
  return () => { window.clearInterval(flap); window.clearTimeout(stop); show(false); };
}
