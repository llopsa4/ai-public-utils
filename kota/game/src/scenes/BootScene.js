// Boot: loads the data files and makes the placeholder textures (shapes drawn in code), then opens the camp.
// Placeholder art stays until the painted sprites are installed (art/PIPELINE.md).

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    this.load.setPath('data/');
    this.load.json('rules', 'rules.json');
    this.load.json('heroes', 'heroes.json');
    this.load.json('threats', 'threats.json');
    this.load.json('waves', 'waves.json');
    this.load.json('weapons', 'weapons.json');
    this.load.json('items', 'items.json');
    this.load.json('helpers', 'helpers.json');
    this.load.json('helperValues', 'helperValues.json');
    this.load.json('camp', 'camp.json');
    this.load.json('arenas', 'arenas.json');
  }

  create() {
    const makeTexture = (key, w, h, draw) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Hero placeholder: a round body with a darker notch on the right so flipping is visible.
    makeTexture('hero_placeholder', 64, 64, (g) => {
      g.fillStyle(0x2a2420, 0.35); g.fillEllipse(32, 56, 40, 12);          // ground shadow
      g.fillStyle(0xa8845c, 1); g.fillCircle(32, 30, 24);
      g.lineStyle(3, 0x3a2c20, 1); g.strokeCircle(32, 30, 24);
      g.fillStyle(0x3a2c20, 1); g.fillCircle(46, 24, 5);                   // facing notch
    });

    // Ground tile: a muted prairie green-grey with scattered darker flecks.
    makeTexture('ground_prairie', 256, 256, (g) => {
      g.fillStyle(0x5a5646, 1); g.fillRect(0, 0, 256, 256);
      const rand = new Phaser.Math.RandomDataGenerator(['kota-ground']);
      for (let i = 0; i < 90; i++) {
        g.fillStyle(rand.pick([0x514e3f, 0x636050, 0x585a44]), 0.7);
        g.fillCircle(rand.between(0, 255), rand.between(0, 255), rand.between(2, 7));
      }
    });

    // Lakeshore ground: dark moss and mud.
    makeTexture('ground_lakeshore', 256, 256, (g) => {
      g.fillStyle(0x4c5240, 1); g.fillRect(0, 0, 256, 256);
      const rand = new Phaser.Math.RandomDataGenerator(['kota-shore']);
      for (let i = 0; i < 90; i++) {
        g.fillStyle(rand.pick([0x434a38, 0x5a5a44, 0x3f3a2c]), 0.7);
        g.fillCircle(rand.between(0, 255), rand.between(0, 255), rand.between(2, 8));
      }
    });

    // Decoration placeholders (no collision).
    makeTexture('prop_sage', 40, 32, (g) => {
      g.fillStyle(0x7d8a72, 1); g.fillCircle(12, 20, 10); g.fillCircle(26, 18, 12); g.fillCircle(19, 12, 9);
      g.lineStyle(2, 0x5a6650, 1); g.strokeCircle(26, 18, 12);
    });
    makeTexture('prop_willow', 64, 80, (g) => {
      g.fillStyle(0x4a3a2a, 1); g.fillRect(29, 40, 6, 36);
      g.fillStyle(0x6e8456, 0.95); g.fillCircle(32, 30, 26);
      g.lineStyle(2, 0x4a6040, 1); g.strokeCircle(32, 30, 26);
    });
    makeTexture('prop_reeds', 36, 56, (g) => {
      g.lineStyle(3, 0x7a8a4a, 1);
      for (const [x, dx] of [[8, -3], [16, 2], [24, -1], [30, 4]]) g.lineBetween(x, 54, x + dx, 6);
      g.fillStyle(0x6b4a2a, 1); g.fillRect(14, 4, 5, 12); g.fillRect(28, 8, 5, 12);
    });
    makeTexture('prop_canoe', 110, 36, (g) => {
      g.fillStyle(0xd8c6a0, 1); g.fillEllipse(55, 18, 104, 30);
      g.lineStyle(3, 0x7a5a38, 1); g.strokeEllipse(55, 18, 104, 30);
      g.fillStyle(0x4a3a2a, 1); g.fillEllipse(55, 18, 80, 16);
    });

    // Threat placeholders: shapeless, cold or dull, no faces (art/STYLE.md; replaced by painted stills later).
    makeTexture('threat_frost_wisp', 48, 48, (g) => {
      g.fillStyle(0x9fd3e6, 0.35); g.fillCircle(24, 24, 22);
      g.fillStyle(0x9fd3e6, 0.9); g.fillCircle(24, 24, 15);
      g.fillStyle(0xe8f6fb, 1); g.fillCircle(24, 24, 7);
    });
    makeTexture('threat_blight_swarm', 28, 28, (g) => {
      g.fillStyle(0x7a8a3a, 1); g.fillTriangle(14, 2, 26, 24, 2, 24);
      g.lineStyle(2, 0x4f5a22, 1); g.strokeTriangle(14, 2, 26, 24, 2, 24);
    });
    makeTexture('threat_hunger_shade', 60, 60, (g) => {
      g.fillStyle(0x4a3f52, 0.5); g.fillCircle(30, 30, 29);
      g.fillStyle(0x4a3f52, 1); g.fillCircle(30, 30, 22);
      g.fillStyle(0x2a2230, 1); g.fillCircle(30, 30, 10);
    });
    makeTexture('threat_sleet_spirit', 56, 56, (g) => {
      g.fillStyle(0xbfe3ee, 0.9); g.fillCircle(28, 28, 9);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const cx = 28 + Math.cos(a) * 18, cy = 28 + Math.sin(a) * 18;
        g.fillStyle(0x9fd3e6, 1);
        g.fillTriangle(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, cx + Math.cos(a + 2.1) * 6, cy + Math.sin(a + 2.1) * 6, cx + Math.cos(a - 2.1) * 6, cy + Math.sin(a - 2.1) * 6);
      }
    });
    makeTexture('threat_gnawing_hollow', 64, 64, (g) => {
      g.fillStyle(0x3a2d48, 1); g.fillCircle(32, 32, 26);
      g.lineStyle(4, 0x6e5a82, 1); g.strokeCircle(32, 32, 26);
      g.fillStyle(0x140f1a, 1); g.fillCircle(32, 32, 15);
    });
    // Boss placeholders: they turn with the boss, so the faces sit at the right and the left.
    const doubleFace = (g, bundle) => {
      g.fillStyle(0x2a2420, 0.35); g.fillEllipse(48, 80, 70, 14);
      g.fillStyle(0x5a4f45, 1); g.fillCircle(48, 48, 36);
      g.lineStyle(3, 0x2a211a, 1); g.strokeCircle(48, 48, 36);
      g.fillStyle(0xd8c6a8, 1); g.fillCircle(80, 48, 11); g.fillCircle(16, 48, 11);          // front face, back face
      g.fillStyle(0x2a211a, 1); g.fillCircle(83, 45, 2); g.fillCircle(83, 51, 2); g.fillCircle(13, 45, 2); g.fillCircle(13, 51, 2);
      if (bundle) { g.fillStyle(0xb08a5a, 1); g.fillRoundedRect(40, 70, 16, 14, 4); }        // the stolen child in a hide bundle
    };
    makeTexture('threat_double_face', 96, 96, (g) => doubleFace(g, true));
    makeTexture('threat_double_face_false', 96, 96, (g) => doubleFace(g, false));
    makeTexture('threat_iya', 140, 140, (g) => {
      g.fillStyle(0x2a2420, 0.35); g.fillEllipse(70, 124, 100, 18);
      g.lineStyle(5, 0x3a2a1c, 1);                                                          // thin legs
      for (const x of [44, 62, 80, 98]) g.lineBetween(x, 96, x + (x < 70 ? -6 : 6), 128);
      g.fillStyle(0x6e4e32, 1); g.fillCircle(70, 62, 52);
      g.lineStyle(4, 0x3a2a1c, 1); g.strokeCircle(70, 62, 52);
      g.fillStyle(0x24160e, 1); g.fillEllipse(106, 62, 20, 30);                            // the mouth, facing right
      g.fillStyle(0xd8c6a8, 1); g.fillCircle(96, 40, 4); g.fillCircle(96, 82, 4);
    });
    makeTexture('ember', 16, 16, (g) => {
      g.fillStyle(0xd9892a, 0.45); g.fillCircle(8, 8, 8);
      g.fillStyle(0xf2b84a, 1); g.fillCircle(8, 8, 5);
    });
    makeTexture('food', 24, 24, (g) => {
      g.fillStyle(0xcfae7a, 1); g.fillCircle(12, 12, 10);
      g.lineStyle(2, 0x6b5530, 1); g.strokeCircle(12, 12, 10);
      g.fillStyle(0x6b5530, 1); g.fillCircle(9, 10, 2); g.fillCircle(15, 12, 2); g.fillCircle(11, 16, 2);
    });
    makeTexture('shard', 22, 8, (g) => {
      g.fillStyle(0xbfe3ee, 1); g.fillTriangle(22, 4, 0, 0, 0, 8);
    });

    // Weapon placeholders, drawn pointing right (code rotates them toward the target).
    makeTexture('weapon_stone_axe', 48, 20, (g) => {
      g.fillStyle(0x6b4a2a, 1); g.fillRect(4, 8, 36, 4);
      g.fillStyle(0x8a8a82, 1); g.fillTriangle(34, 1, 47, 10, 34, 19);
      g.lineStyle(2, 0x4a4a44, 1); g.strokeTriangle(34, 1, 47, 10, 34, 19);
    });
    makeTexture('weapon_bow', 36, 44, (g) => {
      g.lineStyle(4, 0x8a6a42, 1); g.beginPath(); g.arc(4, 22, 20, -1.15, 1.15, false); g.strokePath();
      g.lineStyle(1, 0xe8dcc0, 1); g.lineBetween(15, 5, 15, 39);
    });
    makeTexture('weapon_beaded_knife', 34, 14, (g) => {
      g.fillStyle(0x5a3a22, 1); g.fillRect(2, 5, 10, 5);
      g.fillStyle(0x4a78a8, 1); g.fillRect(8, 4, 3, 7);
      g.fillStyle(0xd8d8d0, 1); g.fillTriangle(12, 3, 33, 7, 12, 11);
    });
    makeTexture('weapon_lacrosse_stick', 56, 28, (g) => {
      g.fillStyle(0x7a5630, 1); g.fillRect(2, 12, 30, 4);
      g.lineStyle(3, 0x7a5630, 1); g.strokeEllipse(40, 14, 28, 22);
      g.lineStyle(1, 0xe8dcc0, 0.9);
      g.lineBetween(30, 14, 52, 14); g.lineBetween(34, 6, 46, 22); g.lineBetween(34, 22, 46, 6);
    });
    makeTexture('weapon_bone_spear', 72, 12, (g) => {
      g.fillStyle(0x6b4a2a, 1); g.fillRect(4, 5, 50, 3);
      g.fillStyle(0xe8e0cc, 1); g.fillTriangle(50, 1, 71, 6, 50, 11);
    });
    makeTexture('weapon_ember_sling', 34, 26, (g) => {
      g.lineStyle(2, 0x8a6a42, 1); g.lineBetween(2, 13, 14, 13);
      g.fillStyle(0x6b4a2a, 1); g.fillCircle(21, 13, 9);
      g.fillStyle(0xf2b84a, 1); g.fillCircle(24, 13, 4);
    });
    makeTexture('arrow', 28, 6, (g) => {
      g.fillStyle(0xd8c9a0, 1); g.fillRect(0, 2, 22, 2);
      g.fillStyle(0xe8e0cc, 1); g.fillTriangle(21, 0, 28, 3, 21, 6);
    });
    makeTexture('lob', 16, 16, (g) => {
      g.fillStyle(0xd9892a, 0.5); g.fillCircle(8, 8, 8);
      g.fillStyle(0xf2b84a, 1); g.fillCircle(8, 8, 5);
    });

    this.scene.start('Camp');
  }
}
