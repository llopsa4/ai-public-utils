import { t } from '../engine/i18n';

/** What the battle panel shows; built by the battle scene from the card rules' state. */
export interface BattleView {
  hero: { name: string; hp: number; maxHp: number; mp: number; maxMp: number; block: number; strain: number };
  enemy: { name: string; hp: number; maxHp: number; block: number; intent: { name: string; damage: number; block: number } };
  energy: number;
  maxEnergy: number;
  hand: { id: string; name: string; kind: 'Attack' | 'Skill'; cost: number; mpCost: number; text: string; playable: boolean; reason: string; asked: boolean }[];
  drawCount: number;
  discardCount: number;
  tonics: number;
  canDrink: boolean;
  canEndTurn: boolean;
  /** The guided fight's current instruction, or null. */
  prompt: string | null;
  /** End turn is the thing to press now (guided). */
  askEndTurn: boolean;
  busy: boolean;
}

export interface BattleHandlers {
  play(id: string): void;
  endTurn(): void;
  tonic(): void;
  skipGuide(): void;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
};

/**
 * The fight's controls, drawn over the battle scene as part of the interface: Mara's and the
 * enemy's panels (health, block, strain, the enemy's next move), the hand of cards, End turn and
 * the tonic. Keyboard: 1–9 play a card, E ends the turn, T drinks a tonic.
 */
export class BattleUi {
  private readonly root: HTMLElement;
  /** Panels, hand and buttons (redrawn on every change). */
  private readonly content: HTMLElement;
  /** Popups, banners and the outcome box (kept across redraws). */
  private readonly layer: HTMLElement;
  private view: BattleView | null = null;
  private readonly onKey = (e: KeyboardEvent) => this.key(e);

  constructor(parent: HTMLElement, private readonly handlers: BattleHandlers) {
    this.root = el('div');
    this.root.id = 'battle';
    this.root.hidden = true;
    this.content = el('div', 'battle-content');
    this.layer = el('div', 'battle-layer');
    this.root.append(this.content, this.layer);
    parent.append(this.root);
  }

  get open(): boolean {
    return !this.root.hidden;
  }

  show(): void {
    this.root.hidden = false;
    document.getElementById('app')?.classList.add('in-battle');
    window.addEventListener('keydown', this.onKey, true);
  }

  hide(): void {
    this.root.hidden = true;
    document.getElementById('app')?.classList.remove('in-battle');
    this.content.replaceChildren();
    this.layer.replaceChildren();
    this.view = null;
    window.removeEventListener('keydown', this.onKey, true);
  }

  private key(e: KeyboardEvent): void {
    const v = this.view;
    if (!v || v.busy || document.querySelector('dialog[open]') || this.layer.querySelector('.battle-outcome')) return;
    if (/^[1-9]$/.test(e.key)) {
      const card = v.hand[Number(e.key) - 1];
      if (card) { e.preventDefault(); e.stopPropagation(); if (card.playable) this.handlers.play(card.id); }
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault(); e.stopPropagation();
      if (v.canEndTurn) this.handlers.endTurn();
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault(); e.stopPropagation();
      if (v.canDrink) this.handlers.tonic();
    }
  }

  render(view: BattleView): void {
    this.view = view;
    this.content.replaceChildren();

    // Fighter panels.
    const bar = (value: number, max: number, cls: string) => {
      const b = el('div', `battle-bar ${cls}`);
      const fill = el('div', 'battle-bar-fill');
      fill.style.width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;
      b.append(fill, el('span', 'battle-bar-text', `${value}/${max}`));
      return b;
    };
    const hero = el('section', 'battle-panel battle-hero');
    hero.setAttribute('aria-label', t('battle.heroPanel'));
    hero.append(el('h2', '', view.hero.name), bar(view.hero.hp, view.hero.maxHp, 'hp'), bar(view.hero.mp, view.hero.maxMp, 'mp'));
    const strain = el('div', 'battle-strain');
    strain.title = t('battle.strainHelp');
    for (let i = 1; i <= 10; i++) {
      const pip = el('span', `pip${i <= view.hero.strain ? ' on' : ''}${i >= 6 && i <= 9 ? ' hot' : ''}${i === 10 ? ' over' : ''}`);
      strain.append(pip);
    }
    const hot = view.hero.strain >= 6 && view.hero.strain <= 9;
    hero.append(el('div', 'battle-strain-label', `${t('battle.strain')} ${view.hero.strain}/10${hot ? ` · ${t('battle.hot')}` : ''}`), strain);
    if (view.hero.block) hero.append(el('div', 'battle-block', `${t('battle.block')} ${view.hero.block}`));

    const enemy = el('section', 'battle-panel battle-enemy');
    enemy.setAttribute('aria-label', t('battle.enemyPanel'));
    enemy.append(el('h2', '', view.enemy.name), bar(view.enemy.hp, view.enemy.maxHp, 'hp'));
    if (view.enemy.block) enemy.append(el('div', 'battle-block', `${t('battle.block')} ${view.enemy.block}`));
    const intent = view.enemy.intent;
    const next = el('div', 'battle-intent');
    next.append(el('span', 'battle-intent-label', t('battle.next')), el('strong', '', intent.name),
      el('span', '', [intent.damage ? t('battle.intentDamage', { n: String(intent.damage) }) : '', intent.block ? t('battle.intentBlock', { n: String(intent.block) }) : ''].filter(Boolean).join(' · ')));
    enemy.append(next);

    // The hand.
    const hand = el('div', 'battle-hand');
    hand.setAttribute('role', 'group');
    hand.setAttribute('aria-label', t('battle.hand'));
    view.hand.forEach((c, i) => {
      const b = el('button', `battle-card ${c.kind === 'Attack' ? 'attack' : 'skill'}${c.asked ? ' asked' : ''}`);
      b.type = 'button';
      b.disabled = !c.playable || view.busy;
      b.title = c.reason || c.text;
      b.dataset.card = c.id;
      const cost = el('span', 'battle-cost', String(c.cost));
      cost.setAttribute('aria-label', t('battle.energyCost', { n: String(c.cost) }));
      b.append(cost, el('span', 'battle-card-name', c.name));
      if (c.mpCost) b.append(el('span', 'battle-card-mp', t('battle.mpCost', { n: String(c.mpCost) })));
      b.append(el('span', 'battle-card-text', c.text), el('span', 'battle-card-key', String(i + 1)));
      b.addEventListener('click', () => this.handlers.play(c.id));
      hand.append(b);
    });

    // Turn controls.
    const side = el('div', 'battle-side');
    const energy = el('div', 'battle-energy');
    energy.append(el('span', 'battle-energy-label', t('battle.energy')));
    for (let i = 0; i < view.maxEnergy; i++) energy.append(el('span', `orb${i < view.energy ? ' on' : ''}`));
    const end = el('button', `btn primary battle-end${view.askEndTurn ? ' asked' : ''}`, t('battle.endTurn'));
    end.type = 'button';
    end.id = 'battle-end';
    end.disabled = !view.canEndTurn || view.busy;
    end.addEventListener('click', () => this.handlers.endTurn());
    const tonic = el('button', 'btn battle-tonic', t('battle.tonic', { n: String(view.tonics) }));
    tonic.type = 'button';
    tonic.id = 'battle-tonic';
    tonic.disabled = !view.canDrink || view.busy;
    tonic.addEventListener('click', () => this.handlers.tonic());
    side.append(energy, end, tonic, el('div', 'battle-piles', t('battle.piles', { draw: String(view.drawCount), discard: String(view.discardCount) })));

    this.content.append(hero, enemy, hand, side);
    if (view.prompt) {
      const guide = el('div', 'battle-guide');
      guide.setAttribute('role', 'status');
      const skip = el('button', 'ink-btn', t('battle.skipGuide'));
      skip.type = 'button';
      skip.addEventListener('click', () => this.handlers.skipGuide());
      guide.append(el('p', '', view.prompt), skip);
      this.content.append(guide);
    }
  }

  /** A number or word floating up from a point (world units 640×360). */
  popup(text: string, x: number, y: number, kind: 'damage' | 'block' | 'heal' | 'warn' | 'info'): void {
    const p = el('div', `battle-pop ${kind}`, text);
    p.style.left = `${(x / 640) * 100}%`;
    p.style.top = `${(y / 360) * 100}%`;
    p.setAttribute('aria-hidden', 'true');
    this.layer.append(p);
    window.setTimeout(() => p.remove(), 1300);
  }

  /** A line across the middle (the fight's name, Mara's hint after a fall). */
  banner(text: string, ms = 1800): void {
    const b = el('div', 'battle-banner', text);
    b.setAttribute('role', 'status');
    this.layer.append(b);
    window.setTimeout(() => b.remove(), ms);
  }

  /** The end of the fight: what was won, and Continue. */
  outcome(title: string, lines: string[], button: string, onClick: () => void): void {
    const box = el('div', 'battle-outcome panel');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', title);
    box.append(el('h2', 'plaque', title));
    for (const line of lines) box.append(el('p', '', line));
    const b = el('button', 'btn primary', button);
    b.type = 'button';
    b.id = 'battle-continue';
    b.addEventListener('click', () => { box.remove(); onClick(); }, { once: true });
    box.append(b);
    this.layer.append(box);
    b.focus({ preventScroll: true });
  }
}
