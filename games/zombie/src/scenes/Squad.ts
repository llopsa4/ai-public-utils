import Phaser from 'phaser';
import { audio } from '../audio/engine';
import { DOUBLE_MS } from '../render/click';
import { hungerLabel, squadMetrics } from '../render/cues';
import { uiFactor } from '../render/cues';
import { squadPortrait } from '../render/ui';
import { type HungerLevel, type SquadCard, type SquadUnit, cycleNext, pressCard, selectIndex, squadCards } from '../render/squad';
import { options } from '../sim/options';
import { bindActionKeys, keyOf } from './actionKeys';
import { kitSlice, uiImage } from './kit';
import { ui } from './uiScale';

// Squad panel (DESIGN §17): one card per survivor down the left edge, always visible, so an off-screen
// survivor can be watched. Click selects, Shift-click adds, double-click centres the camera; F1/F2 and Tab
// select from the keyboard. The head on each card is the small neutral portrait, or the hurt one under 35% HP (DESIGN §6). The overlay reads the
// registry key `m_squad` and reports a card click as the game event `dw-squad`.

const FONT = 'Georgia, "Times New Roman", serif';
export const SQUAD_EVENT = 'dw-squad';
// Card sizes come from `squadMetrics` (DESIGN §19: they grow with the text size); at 100% the first card
// starts at y 140, below the resource, hunger and objective lines of the HUD.

export interface SquadPress {
  id: string;
  add: boolean; // Shift held
  centre: boolean; // second click of a double-click
}

/** True when a screen point is over a squad card, so the world underneath must ignore the click. */
export function overSquad(r: Phaser.Data.DataManager, x: number, y: number): boolean {
  const cards = r.get('m_squad') as SquadCard[] | null | undefined;
  const { x: X, y: Y, w: W, h: H, gap: GAP } = squadMetrics(options().textSize, !!cards?.some((c) => c.hunger));
  return !!cards && cards.length > 0 && x >= X && x <= X + W && y >= Y && y <= Y + cards.length * (H + GAP) - GAP;
}

/** What a scene gives the panel; it keeps owning its selection and its camera. */
export interface SquadHooks {
  units: () => readonly SquadUnit[]; // the roster, in order
  nameOf: (id: string) => string;
  hungerOf?: (id: string) => { frac: number; level: HungerLevel } | undefined;
  selection: () => ReadonlySet<string>;
  select: (ids: Set<string>) => void;
  centreOn: (id: string) => void;
}

/**
 * Wires a playable scene to the panel: F1/F2 and Tab (browser defaults blocked), card clicks, and
 * `publish()` for the scene to call once a frame. Cleans up when the scene shuts down.
 */
export function bindSquad(scene: Phaser.Scene, h: SquadHooks): { publish: () => void } {
  const pick = (id: string | null): void => {
    if (id) h.select(new Set([id]));
  };
  // The keys come from the live key map (rebindable); `bindActionKeys` keeps F1 and Tab from the browser.
  bindActionKeys(scene, {
    select1: () => pick(selectIndex(h.units(), 0)),
    select2: () => pick(selectIndex(h.units(), 1)),
    cycle: () => pick(cycleNext(h.units(), h.selection())),
  });
  const onPress = (p: SquadPress): void => {
    h.select(pressCard(h.units(), h.selection(), p.id, p.add));
    if (p.centre) h.centreOn(p.id);
  };
  scene.game.events.on(SQUAD_EVENT, onPress);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.game.events.off(SQUAD_EVENT, onPress);
    scene.registry.set('m_squad', null);
  });
  return {
    publish: () => scene.registry.set('m_squad', squadCards(h.units(), h.selection(), h.nameOf, [keyOf('select1'), keyOf('select2')], h.hungerOf)),
  };
}

interface Slot {
  id: string;
  box: Phaser.GameObjects.NineSlice;
  frame: Phaser.GameObjects.Rectangle; // the gold outline of a selected card
  hpIcon: Phaser.GameObjects.Image;
  portrait: Phaser.GameObjects.Rectangle;
  head: Phaser.GameObjects.Image;
  headKey: string;
  name: Phaser.GameObjects.Text;
  hp: Phaser.GameObjects.Text;
  key: Phaser.GameObjects.Text;
  word: Phaser.GameObjects.Text;
}

export class SquadScene extends Phaser.Scene {
  private slots: Slot[] = [];
  private signature = '';
  private size = 100;
  private withHunger = false;
  private bars!: Phaser.GameObjects.Graphics;
  private lastId = '';
  private lastAt = -Infinity;

  constructor() {
    super('Squad');
  }

  create(): void {
    this.slots = [];
    this.signature = '';
    this.size = options().textSize;
    this.lastId = '';
    this.lastAt = -Infinity;
    this.bars = this.add.graphics();
  }

  private rebuild(cards: readonly SquadCard[]): void {
    for (const s of this.slots) for (const o of [s.box, s.frame, s.hpIcon, s.portrait, s.head, s.name, s.hp, s.key, s.word]) o.destroy();
    const { x: X, y: Y, w: W, h: H, gap: GAP, portrait: PORTRAIT } = squadMetrics(this.size, this.withHunger);
    this.slots = cards.map((c, i) => {
      const y = Y + i * (H + GAP);
      const box = kitSlice(this, 'kit_card', X, y, W, H, uiFactor(this.size)).setInteractive({ useHandCursor: true });
      const frame = this.add.rectangle(X, y, W, H).setOrigin(0, 0).setStrokeStyle(2, 0xe8c46a).setVisible(false);
      const hpIcon = uiImage(this, 'icon_hud_hp', 0, y + ui(5), ui(16));
      const portrait = this.add.rectangle(X + 6, y + (H - PORTRAIT) / 2, PORTRAIT, PORTRAIT, 0x1a1c19).setOrigin(0, 0).setStrokeStyle(1, 0x8a8d86);
      const head = uiImage(this, 'portrait_small_fighter_neutral', X + 6, y + (H - PORTRAIT) / 2, PORTRAIT).setVisible(false);
      const name = this.add.text(X + PORTRAIT + 14, y + ui(5), '', { fontFamily: FONT, fontSize: `${ui(15)}px`, color: '#e8e6de' });
      const hp = this.add.text(X + W - 8, y + ui(5), '', { fontFamily: FONT, fontSize: `${ui(13)}px`, color: '#a8a69e' }).setOrigin(1, 0);
      const key = this.add.text(X + 6 + PORTRAIT / 2, y + H - 6, c.key, { fontFamily: FONT, fontSize: `${ui(11)}px`, color: '#a8a69e' }).setOrigin(0.5, 1);
      const word = this.add.text(X + PORTRAIT + 14, y + ui(41), '', { fontFamily: FONT, fontSize: `${ui(11)}px`, color: '#e8c46a' }); // DESIGN §19: the hunger bar's word
      box.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (p.rightButtonDown()) return;
        audio.ui();
        const centre = this.lastId === c.id && p.downTime - this.lastAt <= DOUBLE_MS;
        this.lastId = c.id;
        this.lastAt = centre ? -Infinity : p.downTime; // a third click starts over
        this.game.events.emit(SQUAD_EVENT, { id: c.id, add: p.event.shiftKey, centre } satisfies SquadPress);
      });
      return { id: c.id, box, frame, hpIcon, portrait, head, headKey: '', name, hp, key, word };
    });
  }

  update(): void {
    const cards = this.registry.get('m_squad') as SquadCard[] | null | undefined;
    const g = this.bars.clear();
    if (!cards || cards.length === 0) {
      if (this.slots.length) this.rebuild([]);
      this.signature = '';
      return;
    }
    const size = options().textSize;
    const withHunger = cards.some((c) => c.hunger);
    const sig = `${size}:${withHunger}:${cards.map((c) => `${c.id}:${c.key}`).join(',')}`;
    if (sig !== this.signature) {
      this.signature = sig;
      this.size = size;
      this.withHunger = withHunger;
      this.rebuild(cards);
    }
    const { x: X, y: Y, h: H, gap: GAP, portrait: PORTRAIT, w: W } = squadMetrics(size, withHunger);
    const BAR_W = W - PORTRAIT - 26;
    cards.forEach((c, i) => {
      const s = this.slots[i];
      if (!s) return;
      const y = Y + i * (H + GAP);
      s.box.setAlpha(c.alive ? 1 : 0.5);
      s.frame.setVisible(c.selected && c.alive);
      s.portrait.setAlpha(c.alive ? 1 : 0.5);
      const headKey = squadPortrait(c.name, c.hp, c.maxHp);
      if (headKey && headKey !== s.headKey) {
        s.headKey = headKey;
        s.head.setFrame(headKey);
      }
      s.head.setVisible(!!headKey).setAlpha(c.alive ? 1 : 0.5);
      s.name.setText(c.name).setColor(c.alive ? '#e8e6de' : '#8a8d86');
      const word = options().cues && c.alive && c.hunger ? hungerLabel(c.hunger.level) : ''; // DESIGN §19: a word as well as the colour
      s.hp.setText(c.alive ? `${c.hp} HP` : 'down');
      s.hpIcon.setVisible(c.alive).setPosition(X + W - 8 - s.hp.width - ui(16) - 3, y + ui(5) + Math.round((s.hp.height - ui(16)) / 2)).setDisplaySize(ui(16), ui(16));
      s.word.setText(word).setColor(c.hunger?.level === 'low' ? '#e8c46a' : '#e0806a');
      const bx = X + PORTRAIT + 14;
      const frac = c.maxHp > 0 ? Math.max(0, Math.min(1, c.hp / c.maxHp)) : 0;
      g.fillStyle(0x0f110f, 0.9).fillRect(bx, y + ui(25), BAR_W, ui(6));
      g.fillStyle(frac > 0.34 ? 0x9bc79b : 0xd85a4a, 1).fillRect(bx, y + ui(25), BAR_W * frac, ui(6));
      const hu = c.hunger;
      if (hu) {
        // The same colours as the action bar's meter (DESIGN §12): green, yellow at 2 min, red flashing at 30 s, solid red once starving.
        const flash = hu.level === 'critical' && Math.floor(this.time.now / 300) % 2 === 0;
        const color = hu.level === 'ok' ? 0x9bc79b : hu.level === 'low' ? 0xe8c46a : 0xd85a4a;
        g.fillStyle(0x0f110f, 0.9).fillRect(bx, y + ui(35), BAR_W, ui(4));
        if (!flash) g.fillStyle(color, 1).fillRect(bx, y + ui(35), hu.level === 'starving' ? BAR_W : BAR_W * Math.max(0, Math.min(1, hu.frac)), ui(4));
      }
    });
  }
}
