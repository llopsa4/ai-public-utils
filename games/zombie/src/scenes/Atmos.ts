import Phaser from 'phaser';
import {
  type AtmosModel,
  DUSK_ALPHA,
  DUSK_COLOR,
  FOG_COLOR,
  LIGHT_COLOR,
  RAIN_COLOR,
  fogBlobs,
  lightStrength,
  lightsOnScreen,
  rainDrops,
} from '../render/atmos';
import { options } from '../sim/options';

// Overlay for the atmosphere (DESIGN §20): dusk, fog and rain over the world, warm light pools on top of the dusk.
// A playable scene publishes `atmos` (see `AtmosModel`) once a frame; this scene only draws it. It sits between
// the world scenes and their HUD (main.ts lists it so), so labels and panels are never tinted. Looks only.

const POOL_RINGS = 12; // nested ellipses make a soft edge
const POOL_ALPHA = 0.025; // per ring, before strength and flicker
const RAIN_ALPHA = 0.5;
const FOG_RINGS = 3;

export class AtmosScene extends Phaser.Scene {
  private dusk!: Phaser.GameObjects.Graphics;
  private weather!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;

  constructor() {
    super('Atmos');
  }

  create(): void {
    this.dusk = this.add.graphics();
    this.weather = this.add.graphics();
    this.glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD); // light adds to the dusk instead of being darkened by it
  }

  update(): void {
    const m = this.registry.get('atmos') as AtmosModel | null | undefined;
    this.dusk.clear();
    this.weather.clear();
    this.glow.clear();
    if (!m) return;
    const { width: w, height: h } = this.scale;
    const ms = this.time.now;

    if (m.dusk > 0) this.dusk.fillStyle(DUSK_COLOR, DUSK_ALPHA * m.dusk).fillRect(0, 0, w, h);

    if (options().weather) {
      for (const b of fogBlobs(ms, w, h, m.fog)) {
        for (let i = 0; i < FOG_RINGS; i++) {
          const k = 1 - i / FOG_RINGS;
          this.weather.fillStyle(FOG_COLOR, b.a / FOG_RINGS).fillEllipse(b.x, b.y, b.rx * 2 * k, b.ry * 2 * k);
        }
      }
      const drops = rainDrops(ms, m.rain, w, h);
      if (drops.length > 0) {
        this.weather.lineStyle(1.5, RAIN_COLOR, RAIN_ALPHA).beginPath();
        for (let i = 0; i < drops.length; i += 4) {
          this.weather.moveTo(drops[i]!, drops[i + 1]!);
          this.weather.lineTo(drops[i + 2]!, drops[i + 3]!);
        }
        this.weather.strokePath();
      }
    }

    const strength = lightStrength(m.dusk);
    for (const l of lightsOnScreen(m, ms, w, h)) {
      for (let i = 0; i < POOL_RINGS; i++) {
        const k = 1 - i / POOL_RINGS;
        this.glow.fillStyle(LIGHT_COLOR, POOL_ALPHA * strength * l.flicker).fillEllipse(l.x, l.y, l.rx * 2 * k, l.ry * 2 * k);
      }
    }
  }
}

/** Starts the overlay for a playable scene; it stops with the scene and clears its model. */
export function startAtmos(scene: Phaser.Scene): void {
  scene.registry.set('atmos', null);
  scene.scene.launch('Atmos');
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scene.stop('Atmos');
    scene.registry.set('atmos', null);
  });
}

/** Publishes this frame's atmosphere. `view` is the scene's camera (centre and zoom) so the pools sit on the ground. */
export function publishAtmos(scene: Phaser.Scene, view: { centre: readonly [number, number] }, m: Omit<AtmosModel, 'centre' | 'zoom'>): void {
  scene.registry.set('atmos', { ...m, centre: view.centre, zoom: scene.cameras.main.zoom } satisfies AtmosModel);
}
