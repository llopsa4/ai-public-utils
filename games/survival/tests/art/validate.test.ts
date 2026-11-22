// The art validator (scripts/art/lib.mjs): the real manifest, and a good and broken sample inbox.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { deliveryFrames, expectedFrames, validateInbox, validateManifest } from '../../scripts/art/lib.mjs';
import { packGroup } from '../../scripts/art/pack-lib.mjs';
import realManifest from '../../art/manifest.json';

const { PNG } = createRequire(import.meta.url)('pngjs');

type Pixel = [number, number, number, number];
const CLEAR: Pixel = [0, 0, 0, 0];

function writePng(file: string, w: number, h: number, pixel: (x: number, y: number) => Pixel, colorType = 6): void {
  const png = new PNG({ width: w, height: h, colorType, inputColorType: 6, inputHasAlpha: true });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = pixel(x, y);
      png.data.set(p, (y * w + x) * 4);
    }
  }
  fs.writeFileSync(file, PNG.sync.write(png, { colorType, inputColorType: 6, inputHasAlpha: true }));
}

const block = (x0: number, y0: number, x1: number, y1: number, c: Pixel = [200, 120, 80, 255]) =>
  (x: number, y: number): Pixel => (x >= x0 && x <= x1 && y >= y0 && y <= y1 ? c : CLEAR);

// A small person (40x40, anchor 20, 32, two layers, 8 facings, one 1-frame animation) and a tile.
const sample: Record<string, unknown> = {
  person_test: {
    atlas: 'man', cell: [40, 40], anchor: [0.5, 0.8], layers: ['base', 'cloth'], facings: 8,
    anims: { idle: { frames: 1, fps: 4, loop: true } }, seasons: false, states: null, variants: null, border: 2, ground: true,
  },
  tile_test: {
    atlas: 'ground', cell: [16, 8], anchor: [0.5, 0.5], layers: ['base'], facings: 1, anims: null,
    seasons: true, states: null, variants: 2, border: 0, ground: false,
  },
};

interface Options {
  baseBlock?: [number, number, number, number];
  clothBlock?: [number, number, number, number];
}

/** Writes a delivery that passes, then lets a test break one thing. Returns the artDir. */
function makeInbox(opts: Options = {}): string {
  const artDir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-validate-'));
  const dir = path.join(artDir, 'inbox', 'AB99');
  fs.mkdirSync(path.join(dir, 'person_test'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'tile_test'), { recursive: true });
  const [bx0, by0, bx1, by1] = opts.baseBlock ?? [15, 20, 24, 32];
  const [cx0, cy0, cx1, cy1] = opts.clothBlock ?? [16, 22, 23, 28];
  for (const f of expectedFrames('person_test', sample.person_test)) {
    const draw = f.layer === 'cloth' ? block(cx0, cy0, cx1, cy1, [180, 180, 180, 255]) : block(bx0, by0, bx1, by1);
    writePng(path.join(dir, 'person_test', f.file), 40, 40, draw);
  }
  for (const f of expectedFrames('tile_test', sample.tile_test)) {
    writePng(path.join(dir, 'tile_test', f.file), 16, 8, () => [60, 140, 60, 255]);
  }
  writePng(path.join(dir, 'contact.png'), 8, 8, () => [90, 90, 90, 255]);
  fs.writeFileSync(
    path.join(dir, 'delivery.json'),
    JSON.stringify({ batch: 'AB99', revision: 1, brief: 'test', keys: ['person_test', 'tile_test'], tools: {}, prompts: {}, notes: '' }),
  );
  return artDir;
}

const check = (artDir: string) => validateInbox(artDir, 'AB99', sample).errors;
const personFile = (artDir: string, name: string) => path.join(artDir, 'inbox', 'AB99', 'person_test', name);

test('the current manifest validates and has every SPEC key', () => {
  assert.deepEqual(validateManifest(realManifest), []);
  for (const key of ['person_man', 'person_woman', 'person_elder_man', 'person_elder_woman', 'person_child', 'person_rider',
    'animal_wolf', 'animal_deer', 'animal_bison', 'animal_horse', 'animal_fish', 'carcass_deer', 'carcass_bison', 'carcass_wolf',
    'ally_spirit', 'fx_storm', 'fx_hit', 'fx_dust', 'fx_sparkle', 'fx_flame', 'fx_arrow', 'fx_arrow_stuck',
    'fire_central', 'building_store', 'building_store_open', 'building_tipi', 'building_drying_rack', 'building_barricade',
    'tile_grass', 'tile_ford', 'bank_river', 'spill_forest', 'tree_bur_oak', 'tree_willow', 'bush_plum', 'rock_boulder',
    'tuft_grass', 'stump_tree', 'item_basket', 'ui_panel', 'ui_button', 'ui_bar_frame', 'ui_bar_fill', 'ui_emblem',
    'cursor_pointer', 'icon_food', 'icon_upgrade_storm_caller', 'icon_season_winter', 'icon_speed_4x']) {
    assert.ok((realManifest as Record<string, unknown>)[key], key);
  }
  // AC4 retired person_adult and person_elder, AC5 object_tree: no legacy key is left, and the four trees keep the
  // old tree drawing as their code placeholder.
  const keys = realManifest as Record<string, { legacy?: boolean; placeholder?: unknown }>;
  assert.deepEqual(Object.keys(keys).filter((k) => keys[k].legacy), []);
  assert.equal(keys.object_tree, undefined);
  for (const key of ['tree_bur_oak', 'tree_basswood', 'tree_cottonwood', 'tree_willow']) assert.ok(keys[key].placeholder, key);
});

test('frame names and files follow SPEC section 8', () => {
  const m = realManifest as unknown as Record<string, unknown>;
  const names = (key: string) => expectedFrames(key, m[key]).map((f) => f.name);
  assert.ok(names('person_woman').includes('person_woman/cloth/walk/ne/05'));
  assert.ok(names('building_tipi').includes('building_tipi/stage2/00'));
  assert.ok(names('bank_river').includes('bank_river/winter/5'));
  assert.ok(names('tree_willow').includes('tree_willow/autumn/1'));
  assert.ok(names('ui_button').includes('ui_button/hover'));
  assert.ok(names('spill_forest').includes('spill_forest/spring/ne'));
  const woman = expectedFrames('person_woman', m.person_woman);
  // 2 layers x 8 facings x (4+8+8+6+6+6+6+6+6+6+4+6+8+2+6 frames)
  assert.equal(woman.length, 2 * 8 * 88);
  assert.deepEqual(woman[0], { name: 'person_woman/base/idle/s/00', file: 'base_idle_s_00.png', layer: 'base', size: [192, 160] });
  assert.equal(expectedFrames('building_barricade', m.building_barricade).length, 5 * 16);
  assert.equal(expectedFrames('building_drying_rack', m.building_drying_rack).length, 3 + 4 + 4);
  assert.equal(expectedFrames('bank_river', m.bank_river).length, 4 * 15);
  assert.equal(expectedFrames('cursor_move', m.cursor_move).length, 2);
});

test('validateManifest finds broken entries', () => {
  const bad = JSON.parse(JSON.stringify(realManifest));
  bad.person_man.anchor = [0.5, 0.81];
  bad.tile_grass.atlas = 'nowhere';
  bad.fx_hit.status = 'final';
  bad.fx_hit.batch = null;
  const errors = validateManifest(bad).join('\n');
  assert.match(errors, /person_man: anchor 0.81 does not land on a whole pixel/);
  assert.match(errors, /tile_grass: unknown atlas group nowhere/);
  assert.match(errors, /fx_hit: a final key needs batch/);
});

test('a good sample inbox passes', () => {
  const dir = makeInbox();
  const r = validateInbox(dir, 'AB99', sample);
  assert.deepEqual(r.errors, []);
  assert.equal(r.frames, 2 * 8 + 8);
});

test('AB0 accepts its summer grass and concept while keeping other inbox checks', (t) => {
  const artDir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-ab0-'));
  t.after(() => fs.rmSync(artDir, { recursive: true, force: true }));
  const dir = path.join(artDir, 'inbox', 'AB0');
  const keys = ['tile_grass', 'building_tipi', 'ui_panel', 'ui_button', 'icon_food'] as const;
  const reference = path.join(dir, 'concept', 'person_man.png');
  const draw = () => [90, 90, 90, 255] as Pixel;
  fs.mkdirSync(path.dirname(reference), { recursive: true });
  writePng(reference, 8, 8, draw);
  writePng(path.join(dir, 'contact.png'), 8, 8, draw);
  fs.writeFileSync(path.join(dir, 'delivery.json'), JSON.stringify({ batch: 'AB0', revision: 1, brief: 'test', keys, tools: {}, prompts: {} }));
  for (const key of keys) {
    fs.mkdirSync(path.join(dir, key));
    const entry = realManifest[key];
    for (const f of expectedFrames(key, entry)) {
      if (key === 'tile_grass' && !f.file.startsWith('summer_')) continue;
      const [w, h] = f.size;
      writePng(path.join(dir, key, f.file), w, h, block(2, 2, w - 3, h - 3));
    }
  }
  assert.deepEqual(validateInbox(artDir, 'AB0', realManifest), { errors: [], frames: 15 });
  const preview = path.join(artDir, 'preview');
  const ground = packGroup(realManifest, 'ground', ['tile_grass'], (key) => path.join(dir, key), preview, undefined, () => 'AB0');
  assert.equal(ground.frames, 4);
  const atlas = JSON.parse(fs.readFileSync(path.join(preview, 'ground.json'), 'utf8')) as {
    textures: { frames: { filename: string }[] }[];
  };
  assert.deepEqual(atlas.textures.flatMap(({ frames }) => frames.map(({ filename }) => filename)).sort(),
    Array.from({ length: 4 }, (_, i) => `tile_grass/summer/${i}`));
  fs.unlinkSync(path.join(dir, 'tile_grass', 'summer_3.png'));
  fs.unlinkSync(reference);
  fs.mkdirSync(path.join(dir, 'unknown'));
  const errors = validateInbox(artDir, 'AB0', realManifest).errors.join('\n');
  assert.match(errors, /missing summer_3.png/);
  assert.match(errors, /concept\/person_man.png/);
  assert.match(errors, /folder unknown/);
});

test('ordinary deliveries still require all four seasons', () => {
  const dir = makeInbox();
  fs.unlinkSync(path.join(dir, 'inbox', 'AB99', 'tile_test', 'winter_0.png'));
  assert.match(check(dir).join('\n'), /missing winter_0.png/);
});

test('AB12 validates and packs walk only while AB13 still requires the complete man', (t) => {
  const artDir = fs.mkdtempSync(path.join(os.tmpdir(), 'art-ab12-'));
  t.after(() => fs.rmSync(artDir, { recursive: true, force: true }));
  const dir = path.join(artDir, 'inbox', 'AB12');
  const keyDir = path.join(dir, 'person_man');
  fs.mkdirSync(keyDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'delivery.json'), JSON.stringify({ batch: 'AB12', revision: 1, brief: 'test', keys: ['person_man'], tools: {}, prompts: {} }));
  writePng(path.join(dir, 'contact.png'), 8, 8, () => [90, 90, 90, 255]);
  const entry = realManifest.person_man;
  const walk = deliveryFrames('person_man', entry, 'AB12');
  assert.equal(walk.length, 128);
  for (const f of walk) writePng(path.join(keyDir, f.file), 192, 160, block(92, 80, 100, 128));
  assert.deepEqual(validateInbox(artDir, 'AB12', realManifest), { errors: [], frames: 128 });
  const packed = packGroup(realManifest, 'man', ['person_man'], () => keyDir, path.join(artDir, 'atlas'), undefined, () => 'AB12');
  assert.equal(packed.frames, 128);
  assert.equal(deliveryFrames('person_man', entry, 'AB13').length, expectedFrames('person_man', entry).length);
  fs.unlinkSync(path.join(keyDir, 'cloth_walk_e_07.png'));
  assert.match(validateInbox(artDir, 'AB12', realManifest).errors.join('\n'), /missing cloth_walk_e_07.png/);
});

test('a missing frame, an extra file and a wrong name are reported', () => {
  const dir = makeInbox();
  fs.unlinkSync(personFile(dir, 'base_idle_ne_00.png'));
  fs.writeFileSync(personFile(dir, 'base_idle_x_00.png'), '');
  const errors = check(dir).join('\n');
  assert.match(errors, /person_test: missing base_idle_ne_00.png/);
  assert.match(errors, /person_test: unexpected file base_idle_x_00.png/);
});

test('a frame of the wrong size is reported', () => {
  const dir = makeInbox();
  writePng(personFile(dir, 'base_idle_s_00.png'), 41, 40, block(15, 20, 24, 32));
  assert.match(check(dir).join('\n'), /base_idle_s_00.png: size is 41x40, expected 40x40/);
});

test('a pixel inside the 2 px border is reported', () => {
  const dir = makeInbox({ baseBlock: [1, 20, 24, 32] });
  assert.match(check(dir).join('\n'), /not transparent inside the 2 px border/);
});

test('a frame that is not 8-bit RGBA is reported', () => {
  const dir = makeInbox();
  writePng(personFile(dir, 'base_idle_s_00.png'), 40, 40, block(15, 20, 24, 32), 2);
  assert.match(check(dir).join('\n'), /base_idle_s_00.png: must be 8-bit RGBA/);
});

test('cloth outside the base layer is reported', () => {
  const dir = makeInbox({ clothBlock: [3, 3, 12, 12] });
  assert.match(check(dir).join('\n'), /cloth_idle_s_00.png: \d+ of \d+ cloth pixels sit outside the base layer/);
});

test('a figure far from the anchor pixel is reported', () => {
  const dir = makeInbox({ baseBlock: [15, 4, 24, 14], clothBlock: [16, 6, 23, 10] });
  assert.match(check(dir).join('\n'), /nothing is drawn within 4 px above the anchor pixel \(20, 32\)/);
});

test('a missing delivery.json or contact.png is reported', () => {
  const dir = makeInbox();
  fs.unlinkSync(path.join(dir, 'inbox', 'AB99', 'delivery.json'));
  fs.unlinkSync(path.join(dir, 'inbox', 'AB99', 'contact.png'));
  const errors = check(dir).join('\n');
  assert.match(errors, /delivery.json is missing/);
  assert.match(errors, /contact.png is missing/);
});
