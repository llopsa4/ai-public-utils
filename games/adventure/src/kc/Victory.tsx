// Cinderfold's victory screen, shown in place of Kiln Courier's outcome dialog after a win
// (Kiln Courier's `victoryView` setting): a banner, the beaten enemy, what the fight paid as loot
// tiles, a few numbers and one Continue. Styles in kc-local.css.
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { BattleState } from '@kc/game/types';
import { t } from '../engine/i18n';
import { battleVisual } from './presentation';

/** One line of what a fight paid. */
export interface Loot { kind: 'salvage' | 'material'; id: string; amount: number; name: string }

/** Drawn icons (there is no art for salvage and materials yet). */
const ICONS: Record<string, ReactNode> = {
  salvage: <svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
    <path d="M24 9l3 4.5 5.3-1.2.6 5.4 5 2.3-2.4 4.9 2.4 4.9-5 2.3-.6 5.4-5.3-1.2L24 39l-3-4.5-5.3 1.2-.6-5.4-5-2.3 2.4-4.9-2.4-4.9 5-2.3.6-5.4 5.3 1.2z" />
    <circle cx="24" cy="24" r="5.5" /></g></svg>,
  'pressure-coil': <svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M14 10h20M14 38h20" /><path d="M16 13c16 0 16 5 0 5s-16 5 0 5 16 5 0 5-16 5 0 5" transform="translate(8 0)" /></g></svg>,
  material: <svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round">
    <path d="M24 8l14 8v16l-14 8-14-8V16z" /><path d="M10 16l14 8 14-8M24 24v16" /></g></svg>,
};

export function Victory({ state, lesson, loot, onContinue, onReveal }: {
  state: BattleState; lesson: boolean; loot: Loot[]; onContinue: () => void;
  /** Called as each loot tile appears (a sound). */
  onReveal?: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const reduced = document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    button.current?.focus({ preventScroll: true });
    if (!onReveal) return;
    const timers = loot.map((_, i) => window.setTimeout(onReveal, reduced ? 0 : 900 + i * 260));
    return () => timers.forEach(clearTimeout);
  }, []);
  const enemy = state.config.encounter.enemy;
  const stats: [number, string][] = [
    [state.turn, t('battle.turns')],
    [state.hero.hp, t('battle.healthLeft')],
    [enemy.maxHp - state.enemy.hp, t('battle.damageDealt')],
  ];
  return <div className={`kc-victory${reduced ? ' kc-calm' : ''}`} role="dialog" aria-modal="true" aria-labelledby="kc-victory-title" aria-describedby="kc-victory-text">
    <div className="kc-victory-embers" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{
      '--x': `${4 + (i * 41) % 92}%`, '--size': `${3 + (i % 3) * 2}px`, '--time': `${4 + (i % 5) * 0.7}s`,
      '--delay': `${-i * 0.37}s`, '--drift': `${((i % 7) - 3) * 14}px`,
    } as CSSProperties} />)}</div>
    <div className="kc-victory-card">
      <p className="kc-victory-kicker">{lesson ? t('battle.lessonDone') : t('battle.defeated', { name: enemy.name })}</p>
      <h2 id="kc-victory-title" className="kc-victory-title">{t('battle.victory')}</h2>
      <div className="kc-victory-foe" aria-hidden="true"><img src={battleVisual(state).sprite} alt="" /></div>
      <p id="kc-victory-text" className="kc-victory-text">{state.config.encounter.victoryText}</p>
      {loot.length > 0 && <>
        <p className="kc-loot-label">{t('battle.loot')}</p>
        <ul className="kc-loot">{loot.map((l, n) => <li key={l.id} style={{ '--n': n } as CSSProperties}>
          <span className="kc-loot-icon">{ICONS[l.id] ?? ICONS[l.kind] ?? ICONS.material}</span>
          <strong>+{l.amount}</strong><span>{l.name}</span>
        </li>)}</ul>
      </>}
      <dl className="kc-victory-stats">{stats.map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <button ref={button} type="button" id="kc-victory-continue" className="kc-victory-continue" onClick={onContinue}>{t('battle.continue')}</button>
    </div>
  </div>;
}
