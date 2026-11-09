// The suspicion eye beside the satchel: how close the person Silas is deceiving is to seeing through
// him (StoryRules.suspicion, 0 to 3). Open and calm, narrowing, then red; hidden otherwise.
import { chapter } from '../chapters';
import { t } from '../engine/i18n';
import type { GameState } from '../engine/types';
import { $ } from './ui';

/** The eyelid's opening for each level (of the eye's half-height). */
const OPEN = [1, 0.65, 0.35, 0.12];

export function renderSuspicion(state: GameState): void {
  const box = $('suspicion');
  const level = chapter().story.suspicion?.(state) ?? null;
  box.hidden = level === null;
  if (level === null) return;
  const n = Math.max(0, Math.min(3, level));
  if (box.dataset.level === String(n)) return;
  box.dataset.level = String(n);
  box.setAttribute('aria-label', t(`ui.suspicion.${n}`));
  box.title = t(`ui.suspicion.${n}`);
  const h = 9 * OPEN[n];
  box.innerHTML = `<svg viewBox="0 0 32 20" width="32" height="20" aria-hidden="true">
    <path d="M2,10 Q16,${10 - h * 1.6} 30,10 Q16,${10 + h * 1.6} 2,10 Z" class="eye-white"/>
    <circle cx="16" cy="10" r="${Math.max(1.5, h * 0.75)}" class="eye-pupil"/>
    <path d="M2,10 Q16,${10 - h * 1.6} 30,10" class="eye-lid"/></svg>`;
}
