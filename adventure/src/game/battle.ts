import Phaser from 'phaser';
import { sound } from '../audio/sound';
import { cardAvailability, currentIntent, endTurn, playCard, preview, randomSeed } from '../combat/combat';
import { cardDefinition } from '../combat/cards';
import type { BattleState } from '../combat/types';
import { ENCOUNTERS, REWARDS, TUTORIAL } from '../content/combat';
import { MATERIALS } from '../content/combat';
import { t } from '../engine/i18n';
import { drinkTonic, startBattle } from '../engine/kit';
import { settings } from '../engine/settings';
import { ART_SCALE, LOGICAL_H, LOGICAL_W } from '../ui/ui';
import type { BattleView } from '../ui/battle';
import { tagFrame } from './assets';
import type { Session } from './session';

/** What the room asks of a fight. */
export interface BattleRequest {
  encounterId: string;
  /** The first fight is guided step by step. */
  guided: boolean;
  /** The room's background texture (shown darkened behind the fight). */
  backdrop: string;
  /** A snapshot of the room to shatter (texture key), or null for a plain fade. */
  shatter: string | null;
  /** Mara's sheet ('mara' or 'mara-gauntlet'). */
  heroSheet: string;
  /** Called once the fight is won and Continue is pressed. */
  onWin: (battle: BattleState) => void;
}

const HERO_AT = { x: 190, y: 300 };
const ENEMY_AT = { x: 460, y: 292 };
const SHARD_COLS = 8, SHARD_ROWS = 5;

/**
 * A fight, on top of the paused room: Kiln Courier's card rules (src/combat) with Cinderfold's
 * look. The scene draws the backdrop, the two fighters and the effects; the controls are DOM
 * (src/ui/battle.ts). It cannot be lost: a fall restarts the fight with a hint from Mara.
 */
export class BattleScene extends Phaser.Scene {
  private req!: BattleRequest;
  private battle!: BattleState;
  private step = 0;
  private busy = false;
  private hero!: Phaser.GameObjects.Sprite;
  private enemy!: Phaser.GameObjects.Image;
  private seed = 0;

  constructor(private readonly session: Session) { super('battle'); }

  init(req: BattleRequest): void {
    this.req = req;
  }

  preload(): void {
    if (!this.textures.exists('battle-scavenger')) this.load.image('battle-scavenger', BATTLE_IMAGES.scavenger);
  }

  create(): void {
    const req = this.req;
    this.cameras.main.setZoom(ART_SCALE).centerOn(LOGICAL_W / 2, LOGICAL_H / 2);
    // The room, darkened and pushed back.
    this.add.image(0, 0, req.backdrop, '__BASE').setOrigin(0, 0).setScale(1 / ART_SCALE).setTint(0x4a3a40).setDepth(-10);
    // (Graphics: the reduced Phaser build has no shape objects.)
    const floor = this.add.graphics().setDepth(-9);
    floor.fillStyle(0x0a0608, 0.45).fillRect(0, 250, LOGICAL_W, LOGICAL_H - 250);
    for (const at of [HERO_AT, ENEMY_AT]) floor.fillStyle(0x000000, 0.5).fillEllipse(at.x, at.y, 110, 18);
    this.hero = this.add.sprite(HERO_AT.x, HERO_AT.y, req.heroSheet, tagFrame(req.heroSheet, 'stand_side')).setOrigin(0.5, 1).setScale(1.15 / ART_SCALE);
    this.enemy = this.add.image(ENEMY_AT.x, ENEMY_AT.y, 'battle-scavenger').setOrigin(0.5, 1).setScale(0.95 / ART_SCALE).setFlipX(true);
    if (!settings().reducedMotion) {
      this.tweens.add({ targets: this.enemy, y: ENEMY_AT.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this.hero, scaleY: (1.15 / ART_SCALE) * 1.012, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.seed = randomSeed();
    this.battle = startBattle(this.session.state, req.encounterId, this.seed, req.guided);
    this.step = req.guided ? 0 : TUTORIAL.steps.length;
    this.session.ui.battleHandlers = this;
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.session.ui.battle.hide(); this.session.ui.battleHandlers = null; });

    this.busy = true;
    const begin = () => {
      this.busy = false;
      this.session.ui.battle.show();
      this.render();
      this.session.ui.battle.banner(ENCOUNTERS[req.encounterId].enemy.name, 1600);
    };
    if (req.shatter && !settings().reducedMotion) this.shatter(req.shatter, begin);
    else { this.cameras.main.fadeIn(400, 0, 0, 0); this.time.delayedCall(400, begin); }
  }

  /** The room breaks into shards that fall away, with a white flash, revealing the fight. */
  private shatter(key: string, done: () => void): void {
    const tex = this.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement;
    const w = src.width / SHARD_COLS, h = src.height / SHARD_ROWS;
    const k = LOGICAL_W / src.width; // canvas pixels → world units
    const centre = { x: HERO_AT.x + 60, y: HERO_AT.y - 60 };
    sound.shatter();
    for (let r = 0; r < SHARD_ROWS; r++) for (let c = 0; c < SHARD_COLS; c++) {
      const name = `shard-${r}-${c}`;
      if (!tex.has(name)) tex.add(name, 0, c * w, r * h, w, h);
      const x = (c + 0.5) * w * k, y = (r + 0.5) * h * k;
      const shard = this.add.image(x, y, key, name).setScale(k).setDepth(1000);
      const d = Math.hypot(x - centre.x, y - centre.y);
      this.tweens.add({
        targets: shard, delay: 120 + d * 1.2, duration: 700 + Math.random() * 300, ease: 'Quad.easeIn',
        y: y + 260 + Math.random() * 120, x: x + (x - centre.x) * 0.35, angle: (Math.random() - 0.5) * 70, alpha: 0,
        onComplete: () => shard.destroy(),
      });
    }
    const flash = this.add.graphics().setDepth(1001);
    flash.fillStyle(0xffffff, 0.85).fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    this.tweens.add({ targets: flash, alpha: 0, duration: 260, onComplete: () => flash.destroy() });
    this.time.delayedCall(1300, done);
    // Free the snapshot once the last shard has fallen.
    this.time.delayedCall(2600, () => { if (this.textures.exists(key)) this.textures.remove(key); });
  }

  // ------------------------------------------------------------- the rules ---
  private guide(): (typeof TUTORIAL.steps)[number] | null {
    return this.step < TUTORIAL.steps.length ? TUTORIAL.steps[this.step] : null;
  }

  /**
   * Asks for the current guided step's card. A step whose card is no longer in hand (played
   * early, or drawn out of order by Pressure Cycle) or cannot be paid for is skipped, so the guide
   * never locks the fight.
   */
  private setPractice(): void {
    for (let s = this.guide(); s && 'play' in s; s = this.guide()) {
      const card = this.battle.hand.find(c => c.id === s.play);
      if (card && cardAvailability(this.battle, card).affordable) break;
      this.step++;
    }
    const s = this.guide();
    this.battle.practice = s ? { requiredCardId: 'play' in s ? s.play : null } : undefined;
  }

  play(id: string): void {
    if (this.busy) return;
    const before = this.battle;
    const card = before.hand.find(c => c.id === id);
    if (!card) return;
    const effect = preview(before, card);
    const next = playCard(before, id);
    if (next === before) return;
    this.battle = next;
    const g = this.guide();
    if (g && 'play' in g && g.play === id) this.step++;
    this.setPractice();
    const data = cardDefinition(card);
    const ui = this.session.ui.battle;
    if (effect.damage) {
      this.lunge(this.hero, 26);
      this.time.delayedCall(140, () => {
        this.hurt(this.enemy);
        sound.strike(effect.damage);
        const lost = before.enemy.hp - next.enemy.hp;
        ui.popup(lost ? `-${lost}` : t('battle.blocked'), ENEMY_AT.x, ENEMY_AT.y - 110, 'damage');
      });
    }
    if (effect.block) { sound.guard(); ui.popup(`+${effect.block} ${t('battle.block')}`, HERO_AT.x, HERO_AT.y - 140, 'block'); }
    if ((data.strain ?? 0) < 0) ui.popup(t('battle.vented'), HERO_AT.x, HERO_AT.y - 120, 'info');
    if (effect.overload) {
      ui.popup(t('battle.overload'), HERO_AT.x, HERO_AT.y - 100, 'warn');
      this.hurt(this.hero);
      if (!settings().reducedMotion) this.cameras.main.shake(220, 0.006);
    }
    this.after();
  }

  endTurn(): void {
    if (this.busy) return;
    const before = this.battle;
    const next = endTurn(before);
    if (next === before) return;
    this.busy = true;
    this.render();
    const g = this.guide();
    if (g && 'endTurn' in g) this.step++;
    const intent = currentIntent(before);
    this.lunge(this.enemy, -30);
    this.time.delayedCall(180, () => {
      this.battle = next;
      this.setPractice();
      const lost = before.hero.hp - next.hero.hp;
      if (intent.damage) {
        this.hurt(this.hero);
        sound.strike(intent.damage);
        this.session.ui.battle.popup(lost ? `-${lost}` : t('battle.blocked'), HERO_AT.x, HERO_AT.y - 120, lost ? 'damage' : 'block');
        if (lost && !settings().reducedMotion) this.cameras.main.shake(160, 0.004);
      }
      if (intent.block) this.session.ui.battle.popup(`+${intent.block} ${t('battle.block')}`, ENEMY_AT.x, ENEMY_AT.y - 120, 'block');
      this.time.delayedCall(350, () => { this.busy = false; this.after(); });
    });
  }

  tonic(): void {
    if (this.busy) return;
    const next = drinkTonic(this.battle, this.session.state.bag);
    if (next === this.battle) return;
    const gained = next.hero.hp - this.battle.hero.hp;
    this.battle = next;
    sound.pickup();
    this.session.ui.battle.popup(`+${gained}`, HERO_AT.x, HERO_AT.y - 130, 'heal');
    this.after();
  }

  skipGuide(): void {
    this.step = TUTORIAL.steps.length;
    this.setPractice();
    this.render();
  }

  /** After every change: the outcome, or the next view. */
  private after(): void {
    const b = this.battle;
    if (b.outcome === 'victory') { this.win(); return; }
    if (b.outcome === 'defeat') { this.fall(); return; }
    this.render();
  }

  private win(): void {
    this.busy = true;
    this.render();
    sound.rumble(400);
    this.tweens.killTweensOf(this.enemy);
    this.tweens.add({ targets: this.enemy, alpha: 0, y: this.enemy.y + 8, duration: 900, ease: 'Quad.easeIn' });
    this.flashTint(this.enemy, 6);
    const reward = REWARDS[this.req.encounterId];
    const lines = [ENCOUNTERS[this.req.encounterId].victoryText];
    if (reward) {
      lines.push(t('battle.rewardSalvage', { n: String(reward.salvage) }));
      for (const [id, n] of Object.entries(reward.materials)) lines.push(t('battle.rewardMaterial', { n: String(n), name: t(MATERIALS[id].name) }));
    }
    this.time.delayedCall(1000, () => {
      this.session.ui.battle.outcome(t('battle.victory'), lines, t('battle.continue'), () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(420, () => this.req.onWin(this.battle));
      });
    });
  }

  /** Mara goes down: no game over in the tutorial; the fight starts again, with a hint. */
  private fall(): void {
    this.busy = true;
    this.render();
    this.tweens.add({ targets: this.hero, angle: -8, alpha: 0.5, duration: 500 });
    this.time.delayedCall(900, () => {
      this.session.ui.battle.banner(t('battle.retry'), 2600);
      this.battle = startBattle(this.session.state, this.req.encounterId, ++this.seed, false);
      this.battle.hero.hp = Math.max(this.battle.hero.hp, Math.round(this.battle.config.hero.maxHp * 0.6));
      this.step = TUTORIAL.steps.length;
      this.tweens.add({ targets: this.hero, angle: 0, alpha: 1, duration: 400 });
      this.busy = false;
      this.render();
    });
  }

  // ------------------------------------------------------------ presentation ---
  private lunge(target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.GameObject, dx: number): void {
    if (settings().reducedMotion) return;
    const x = (target as unknown as { x: number }).x;
    this.tweens.add({ targets: target, x: x + dx, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
  }

  private hurt(target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite): void {
    this.flashTint(target, 2);
  }

  private flashTint(target: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite, times: number): void {
    let n = 0;
    const blink = () => {
      if (!target.active) return;
      if (n % 2 === 0) target.setTintFill(0xffffff); else target.clearTint();
      if (++n < times * 2) this.time.delayedCall(70, blink);
    };
    blink();
  }

  private render(): void {
    const b = this.battle, enc = b.config.encounter;
    const g = this.guide();
    const intent = currentIntent(b);
    const view: BattleView = {
      hero: { name: b.config.hero.name, hp: b.hero.hp, maxHp: b.config.hero.maxHp, mp: b.mp, maxMp: b.config.hero.maxMp, block: b.hero.block, strain: b.strain },
      enemy: { name: enc.enemy.name, hp: b.enemy.hp, maxHp: enc.enemy.maxHp, block: b.enemy.block, intent: { name: intent.name, damage: intent.damage, block: intent.block } },
      energy: b.energy, maxEnergy: enc.energyPerTurn,
      hand: b.hand.map(c => {
        const data = cardDefinition(c);
        const can = cardAvailability(b, c);
        const asked = !!g && 'play' in g && g.play === c.id;
        const locked = !!b.practice?.requiredCardId && !asked;
        return {
          id: c.id, name: data.name, kind: data.kind, cost: data.cost, mpCost: data.mpCost ?? 0, text: data.text,
          playable: can.affordable && !locked && !b.outcome, reason: (can.energyReason + can.mpReason).trim() || (locked ? t('battle.followGuide') : ''), asked,
        };
      }),
      drawCount: b.draw.length, discardCount: b.discard.length,
      tonics: this.session.state.bag.tonics,
      canDrink: this.session.state.bag.tonics > 0 && b.hero.hp < b.config.hero.maxHp && !b.outcome,
      canEndTurn: !b.outcome && !b.practice?.requiredCardId,
      prompt: g ? t(g.prompt) : null,
      askEndTurn: !!g && 'endTurn' in g,
      busy: this.busy,
    };
    this.session.ui.battle.render(view);
  }
}

/** Battle sprites (art/src/battle). */
const battleFiles = import.meta.glob('../../art/src/battle/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const BATTLE_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(battleFiles).map(([path, url]) => [path.replace(/^.*\/([\w-]+)\.png$/, '$1'), url]),
);

