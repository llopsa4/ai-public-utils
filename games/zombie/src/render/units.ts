import { GAME_FONT } from './font';
import type Phaser from 'phaser';
import manifest from '../../art/manifest.json';
import type { Enemy, Stance, Survivor } from '../sim/mission';
import { options } from '../sim/options';
import { ui } from '../scenes/uiScale';
import { hasFigure } from './atlas';
import { stateCue } from './cues';
import { FIGURES, type Facing, atlasScale, drawnFacing, frameName, phaseOf, pickFrame, screenFacing, zombieVariant } from './figure';
import { anchorOf } from './placeholders';

// The one place a sim unit becomes a picture, shared by the Mission, Intro and Base scenes. A figure
// with an atlas (survivors, zombies) animates from the sim state; anything else (the human guard, or
// a figure whose atlas is missing) stays the old grey capsule, squashed for crouch and crawl.
const STANCE_SCALE: Record<Stance, number> = { walk: 1, crouch: 0.72, crawl: 0.4 };
const [AX, AY] = manifest.figures.anchor;
// Contact shadow: a 2:1 ellipse (the iso foreshortening) in world px. Depth 0.55 sits above the ground (0), decals
// (0.2) and the selection ring (0.5), under the tile markers (0.6) and every figure (depth = its y).
const SHADOW_W = 34;
const SHADOW_H = 17;
const SHADOW_ALPHA = 0.32;
const SHADOW_DEPTH = 0.55;

const figureKey = (u: Survivor | Enemy): string | null => (u.side === 'survivor' ? u.kind : u.kind === 'zombie' ? zombieVariant(u.id) : null);

const legacyKeyOf = (u: Survivor | Enemy): string => (u.side === 'survivor' ? `survivor_${u.kind}` : u.kind === 'zombie' ? 'zombie' : 'human_guard');

export class UnitSprite {
  readonly body: Phaser.GameObjects.Image;
  readonly ring?: Phaser.GameObjects.Image;
  /** Soft contact shadow (DESIGN §20 *Visual pass*): drawn in code, never painted into the art. */
  private readonly shadow: Phaser.GameObjects.Ellipse;
  /** `!` over a chasing enemy, `?` over an investigating one (shape cues, DESIGN §19); hidden otherwise. */
  private readonly cue: Phaser.GameObjects.Text;
  /** True while a dead unit's death anim plays: its body sprite stays hidden until it ends. */
  dying = false;
  private readonly key: string | null; // atlas figure key; null: grey capsule
  private readonly group: string;
  private readonly legacy: string;
  private readonly scale: number; // 1 / the sheet's resolution: a 2x sheet is drawn at 0.5 to keep its world size
  private readonly phase: number;
  private facing: Facing = 'se';
  private diedTick: number | null = null;
  private shown = '';

  constructor(scene: Phaser.Scene, u: Survivor | Enemy, ring?: Phaser.GameObjects.Image) {
    this.ring = ring;
    this.legacy = legacyKeyOf(u);
    const key = figureKey(u);
    const def = key ? FIGURES[key] : undefined;
    this.key = key && def && hasFigure(scene, def.atlas, key) ? key : null;
    this.group = def?.atlas ?? '';
    this.scale = 1 / atlasScale(this.group);
    this.phase = phaseOf(u.id);
    if (u.hp <= 0) this.diedTick = -1e9; // already dead when first seen: no death anim
    const first = this.key ? { tex: this.group, frame: frameName(this.key, 'idle', 'se', 0) } : { tex: this.legacy, frame: undefined };
    this.body = scene.add.image(0, 0, first.tex, first.frame);
    this.body.setOrigin(...(this.key ? [AX, AY] : anchorOf(this.legacy)));
    if (this.key) this.body.setScale(this.scale);
    this.shadow = scene.add.ellipse(0, 0, SHADOW_W, SHADOW_H, 0x000000, SHADOW_ALPHA).setDepth(SHADOW_DEPTH).setVisible(false);
    this.cue = scene.add.text(0, 0, '', { fontFamily: GAME_FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#141614', strokeThickness: 4 }).setOrigin(0.5, 1).setDepth(900).setVisible(false);
  }

  /**
   * Shows or hides the contact shadow under the figure's feet and the state cue above them, at (x, y)
   * world px; call after `update`.
   */
  showCue(u: Survivor | Enemy, drawn: boolean, x: number, y: number): void {
    this.shadow.setVisible(drawn).setPosition(x, y); // Z101: flat dark ellipse at the feet, above the ground and decals, under every figure
    const glyph = drawn && u.side !== 'survivor' && u.hp > 0 && options().cues ? stateCue(u.ai.mode) : null;
    this.cue.setVisible(glyph !== null);
    if (!glyph) return;
    const px = `${ui(22)}px`;
    if (this.cue.style.fontSize !== px) this.cue.setFontSize(ui(22));
    this.cue.setText(glyph).setColor(glyph === '!' ? '#ff8a78' : '#f0dc8a').setPosition(x, y - 58);
  }

  /**
   * Chooses the frame, the mirroring and whether the figure is drawn. The scene still sets position,
   * depth and tint. Returns false when nothing of the figure is drawn (hidden, or dead and finished).
   */
  update(u: Survivor | Enemy, tick: number, frac: number, hidden = false): boolean {
    if (u.hp <= 0 && this.diedTick === null) this.diedTick = tick;
    const key = this.key;
    if (!key) {
      this.dying = false;
      const on = u.hp > 0 && !hidden;
      this.body.setVisible(on);
      if (on && u.side === 'survivor') this.body.setScale(1, STANCE_SCALE[u.stance]);
      return on;
    }
    this.facing = screenFacing(u.facing, this.facing);
    const { facing, flip } = drawnFacing(this.facing);
    const pick = pickFrame(u, FIGURES[key]!.anims, tick, frac, this.phase, this.diedTick ?? tick);
    this.dying = u.hp <= 0 && !pick.finished;
    const on = (u.hp > 0 || this.dying) && !hidden;
    this.body.setVisible(on);
    if (!on && !(hidden && u.hp > 0)) return false;
    // A living figure hidden by a roof still takes its frame: Theo's highlight copies it (DESIGN §5).
    const name = frameName(key, pick.anim, facing, pick.frame);
    if (name !== this.shown) {
      this.body.setFrame(name);
      this.shown = name;
    }
    this.body.setFlipX(flip);
    return on;
  }
}
