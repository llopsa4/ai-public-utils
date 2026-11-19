// The suspicion eye beside the satchel: how close the person Silas is deceiving is to seeing through
// him (StoryRules.suspicion, 0 to 3). Open and calm, narrowing, then red; hidden otherwise. Codex's
// strip of four 48x48 eyes (art/src/ui/suspicion-eye.png), one per level, left to right.
import eyes from '../../art/src/ui/suspicion-eye.png';
import { chapter } from '../chapters';
import { t } from '../engine/i18n';
import type { GameState } from '../engine/types';
import { $ } from './ui';

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
  box.style.backgroundImage = `url(${eyes})`;
  // A percentage aligns that share of the strip with the box: frame n is n thirds along.
  box.style.backgroundPosition = `${(n * 100) / 3}% 0`;
}
