// Waves (DESIGN-m1.md section 7): wave length and the spawner that queues threat groups from data/waves.json.

/** Seconds a wave lasts: 20 s for wave 1, 5 s longer each wave, at most 60 s. */
export const waveLength = (n) => Math.min(20 + 5 * (n - 1), 60);

function pickKind(mix) {
  let total = 0;
  for (const w of Object.values(mix)) total += w;
  let roll = Math.random() * total;
  for (const [id, w] of Object.entries(mix)) { roll -= w; if (roll <= 0) return id; }
  return Object.keys(mix)[0];
}

export class Spawner {
  constructor(scene, waves, threats) {
    this.scene = scene; this.waves = waves; this.threats = threats;
    this.def = null; this.clock = 0; this.wave = 0;
  }

  start(wave) {
    this.wave = wave; this.def = this.waves[wave - 1]; this.clock = 0.3;
    // def.elite and def.boss (Double-Face on wave 10, Iya on wave 20) are spawned by plan task C5.
  }

  stop() { this.def = null; }

  /** A random spot in the arena at least 260 px from the hero and clear of the edge. */
  spot() {
    const s = this.scene, [AW, AH] = s.arena;
    let x = 0, y = 0;
    for (let i = 0; i < 20; i++) {
      x = 60 + Math.random() * (AW - 120); y = 60 + Math.random() * (AH - 120);
      if (Math.hypot(x - s.hero.x, y - s.hero.y) >= 260) break;
    }
    return { x, y };
  }

  update(dt) {
    if (!this.def) return;
    this.clock -= dt;
    while (this.clock <= 0) {
      this.clock += this.def.every;
      for (let i = 0; i < this.def.group; i++) {
        if (this.threats.count >= this.scene.rules.caps.threats) break;
        const { x, y } = this.spot();
        this.threats.queue(pickKind(this.def.mix), x, y, this.wave);
      }
    }
  }
}
