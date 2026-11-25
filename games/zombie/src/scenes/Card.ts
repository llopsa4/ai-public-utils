import { GAME_FONT } from '../render/font';
import Phaser from 'phaser';
import story from '../data/story.json';

// Scene changes and location cards (DESIGN §22): every change fades to black (0.6 s), starts the next
// scene under the black, shows that scene's card (2 s, if it has one) and fades in. Any key skips the card.
// The card is a scene that runs all the time and draws over every other scene and HUD (it is brought to
// the top before each change); the dialogue and pause menus leave it running.

export const CARD_SCENE = 'Card';
export const FADE_MS = 600;
export const CARD_MS = 2000;

const CARDS: Readonly<Record<string, string>> = story.cards;

type Phase = 'idle' | 'covering' | 'holding' | 'revealing';

/**
 * Changes from `from` to the scene `key`. Without the Card scene running (only in tests or before Boot
 * has launched it), the change is immediate.
 */
export function changeScene(from: Phaser.Scene, key: string, data?: object): void {
  if (!from.scene.isActive(CARD_SCENE)) {
    from.scene.start(key, data);
    return;
  }
  const veil = from.scene.get(CARD_SCENE) as CardScene;
  veil.cover(() => {
    // The target's create (its first frame under the black) starts the reveal with its card text.
    from.scene.get(key).events.once(Phaser.Scenes.Events.CREATE, () => veil.reveal(CARDS[key]));
    from.scene.start(key, data);
  });
}

export class CardScene extends Phaser.Scene {
  private veil!: Phaser.GameObjects.Rectangle;
  private text!: Phaser.GameObjects.Text;
  private phase: Phase = 'idle';
  private hold?: Phaser.Time.TimerEvent;

  constructor() {
    super(CARD_SCENE);
  }

  create(): void {
    const { width, height } = this.scale;
    // Solid black; the fades move the object's alpha (the fill itself stays opaque).
    this.veil = this.add.rectangle(0, 0, width, height, 0x000000, 1).setOrigin(0).setScrollFactor(0).setAlpha(0);
    this.text = this
      .add.text(width / 2, height / 2, '', { fontFamily: GAME_FONT, fontSize: '40px', color: '#d6d4cc', align: 'center' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScrollFactor(0);
    this.input.keyboard?.on('keydown', () => this.skip());
  }

  /** Keeps the card over the scenes that start or open during the change (the new scene, its dialogue). */
  update(): void {
    if (this.phase !== 'idle') this.scene.bringToTop();
  }

  /** Fades to black, then calls `then` (which starts the next scene). */
  cover(then: () => void): void {
    this.phase = 'covering';
    this.hold?.remove();
    this.hold = undefined;
    this.tweens.killAll();
    this.scene.bringToTop();
    this.text.setAlpha(0);
    this.tweens.add({ targets: this.veil, alpha: 1, duration: FADE_MS, onComplete: then });
  }

  /** The new scene is up under the black: show its card for CARD_MS (none: fade in at once), then fade in. */
  reveal(card?: string): void {
    this.phase = 'holding';
    this.veil.setAlpha(1);
    if (!card) {
      this.fadeIn();
      return;
    }
    this.text.setText(card).setAlpha(1);
    this.hold = this.time.delayedCall(CARD_MS, () => this.fadeIn());
  }

  /** Any key during the card ends it at once. */
  private skip(): void {
    if (this.phase === 'holding') this.fadeIn();
  }

  private fadeIn(): void {
    if (this.phase === 'revealing' || this.phase === 'idle') return;
    this.phase = 'revealing';
    this.hold?.remove();
    this.hold = undefined;
    this.tweens.add({
      targets: [this.veil, this.text],
      alpha: 0,
      duration: FADE_MS,
      onComplete: () => {
        this.phase = 'idle';
      },
    });
  }
}
