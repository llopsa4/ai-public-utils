import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';
import { crc32, deflateSync } from 'node:zlib';

const project = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(project, 'art', 'manifest.json'), 'utf8'));
const temps: string[] = [];
after(() => temps.forEach((t) => rmSync(t, { recursive: true, force: true })));

/** A temp 1x fixture, independent of which production sheets have received 2x art. */
function makeRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'dw-art-'));
  temps.push(root);
  mkdirSync(join(root, 'art'), { recursive: true });
  const fixture = structuredClone(manifest);
  for (const atlas of Object.values(fixture.atlases) as { scale: number }[]) atlas.scale = 1;
  writeFileSync(join(root, 'art', 'manifest.json'), JSON.stringify(fixture));
  return root;
}

function run(script: 'pack' | 'standins', root: string, ...args: string[]) {
  const r = spawnSync(process.execPath, [join(project, 'scripts', 'art', `${script}.mjs`), '--root', root, ...args], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

/** A transparent RGBA PNG of the given size, written by hand so the test needs no PNG library. */
function blankPng(w: number, h: number): Buffer {
  const chunk = (type: string, data: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), data]);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h); // filter byte 0 + zero pixels
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const frameCount = (key: string) => Object.values(manifest.figures.keys[key].anims as Record<string, number>).reduce((a, b) => a + b, 0) * 2;
const standinList = (root: string) => JSON.parse(readFileSync(join(root, 'art', 'frames', 'standins.json'), 'utf8')) as Record<string, string[]>;

test('standins write every contract frame, record them, and build the atlases', () => {
  const root = makeRoot();
  const r = run('standins', root);
  assert.equal(r.code, 0, r.err);
  const list = standinList(root);
  assert.equal(list.fighter.length, 76);
  assert.equal(frameCount('fighter'), 76);
  assert.equal(list.scout.length, 66);
  assert.equal(list.zombie_rotting_c.length, 52);
  for (const key of Object.keys(manifest.figures.keys)) assert.equal(list[key].length, frameCount(key), key);

  // One sheet per decay level, three bodies (a, b, c) on each: 3 bodies x 52 frames (the fixture runs every sheet at 1x).
  const sheet = (decay: string) => JSON.parse(readFileSync(join(root, 'art', 'atlas', `zombies_${decay}.json`), 'utf8'));
  for (const decay of ['fresh', 'decayed', 'rotting']) {
    const zombies = sheet(decay);
    assert.equal(Object.keys(zombies.frames).length, 156, decay);
    for (const f of Object.values(zombies.frames) as { frame: { w: number; h: number } }[]) assert.deepEqual([f.frame.w, f.frame.h], [64, 64]);
  }
  assert.ok(sheet('fresh').frames['zombie_fresh_b_lurch_ne_5']);
  assert.ok(sheet('rotting').frames['zombie_rotting_c_death_se_3']);
  const fighter = JSON.parse(readFileSync(join(root, 'art', 'atlas', 'fighter.json'), 'utf8'));
  assert.ok(fighter.frames['fighter_takedown_se_3'] && fighter.frames['fighter_idle_ne_0']);
  assert.equal(fighter.meta.image, 'fighter.png');

  const again = run('standins', root);
  assert.match(again.out, /Wrote 0 new/);
});

test('pack installs a valid batch, replaces the stand-in and keeps the atlas whole', () => {
  const root = makeRoot();
  run('standins', root);
  const inbox = join(root, 'art', 'inbox', 'T1', 'fighter');
  mkdirSync(inbox, { recursive: true });
  const before = readFileSync(join(root, 'art', 'frames', 'fighter', 'idle_se_0.png'));
  // Any valid 64x64 PNG will do; borrow another stand-in's pixels.
  copyFileSync(join(root, 'art', 'frames', 'fighter', 'walk_ne_2.png'), join(inbox, 'idle_se_0.png'));
  copyFileSync(join(root, 'art', 'frames', 'fighter', 'walk_ne_3.png'), join(inbox, 'idle_ne_0.png'));
  const r = run('pack', root, 'T1');
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /Installed 2 frames/);
  assert.notDeepEqual(readFileSync(join(root, 'art', 'frames', 'fighter', 'idle_se_0.png')), before);
  assert.ok(!standinList(root).fighter.includes('idle_se_0.png'));
  assert.equal(standinList(root).fighter.length, 74);
  const fighter = JSON.parse(readFileSync(join(root, 'art', 'atlas', 'fighter.json'), 'utf8'));
  assert.equal(Object.keys(fighter.frames).length, 76);
});

test('pack fails clearly on bad frames and installs nothing', () => {
  const cases: [string, string, string, RegExp][] = [
    ['sw facing', 'fighter', 'idle_sw_0.png', /idle_sw_0\.png: facing "sw" is not drawn/],
    ['misnamed', 'fighter', 'walking.png', /walking\.png: misnamed/],
    ['unknown anim', 'fighter', 'dance_se_0.png', /dance_se_0\.png: unknown anim "dance"/],
    ['index out of range', 'fighter', 'walk_se_4.png', /walk_se_4\.png: frame index 4 out of range/],
    ['leading zero', 'fighter', 'walk_se_01.png', /walk_se_01\.png: frame numbers must be written without leading zeros/],
    ['unknown figure', 'dragon', 'idle_se_0.png', /art\/inbox\/B1\/dragon: unknown figure key/],
  ];
  for (const [label, key, file, expected] of cases) {
    const root = makeRoot();
    run('standins', root);
    const good = join(root, 'art', 'inbox', 'B1', 'fighter');
    mkdirSync(good, { recursive: true });
    copyFileSync(join(root, 'art', 'frames', 'fighter', 'walk_se_0.png'), join(good, 'walk_se_0.png'));
    mkdirSync(join(root, 'art', 'inbox', 'B1', key), { recursive: true });
    writeFileSync(join(root, 'art', 'inbox', 'B1', key, file), blankPng(64, 64));
    const r = run('pack', root, 'B1');
    assert.equal(r.code, 1, label);
    assert.match(r.err, expected, label);
    assert.match(r.err, /nothing installed/, label);
    assert.ok(standinList(root).fighter.includes('walk_se_0.png'), `${label}: the good frame must stay a stand-in`);
  }
});

test('pack rejects a wrong size and an off-palette colour, naming the file', () => {
  const root = makeRoot();
  run('standins', root);
  const inbox = join(root, 'art', 'inbox', 'S1', 'scout');
  mkdirSync(inbox, { recursive: true });
  writeFileSync(join(inbox, 'idle_se_0.png'), blankPng(48, 48));
  const size = run('pack', root, 'S1');
  assert.equal(size.code, 1);
  assert.match(size.err, /scout\/idle_se_0\.png: size 48x48, expected 64x64/);

  // A palette that does not hold the grey stand-in colours rejects a stand-in-made frame.
  writeFileSync(join(root, 'art', 'palette.json'), JSON.stringify(['#112233', '#445566']));
  copyFileSync(join(root, 'art', 'frames', 'scout', 'walk_se_0.png'), join(inbox, 'idle_se_0.png'));
  const palette = run('pack', root, 'S1');
  assert.equal(palette.code, 1);
  assert.match(palette.err, /scout\/idle_se_0\.png: off-palette colour #/);
});

test('pack without a palette file warns and a missing batch folder fails', () => {
  const root = makeRoot();
  run('standins', root);
  assert.ok(!existsSync(join(root, 'art', 'palette.json')));
  const missing = run('pack', root, 'NOPE');
  assert.equal(missing.code, 1);
  assert.match(missing.err, /No such batch folder/);
  const inbox = join(root, 'art', 'inbox', 'W1', 'zombie_fresh_a');
  mkdirSync(inbox, { recursive: true });
  copyFileSync(join(root, 'art', 'frames', 'zombie_fresh_a', 'bite_se_2.png'), join(inbox, 'bite_se_2.png'));
  const ok = run('pack', root, 'W1');
  assert.equal(ok.code, 0, ok.err);
  assert.match(ok.err, /palette check skipped/);
});

test('UI stand-ins are written at source size, packed into one atlas, and a ui batch installs', () => {
  const root = makeRoot();
  const r = run('standins', root);
  assert.equal(r.code, 0, r.err);
  const items = Object.entries(manifest.ui.items) as [string, { group: string; size: number[] }][];
  assert.equal(standinList(root).ui.length, items.length);
  for (const [name, it] of items) assert.deepEqual(sizeOf(join(root, 'art', 'frames', 'ui', `${name}.png`)), it.size, name);
  const atlas = JSON.parse(readFileSync(join(root, 'art', 'atlas', 'ui.json'), 'utf8'));
  const packed = items.filter(([, it]) => manifest.ui.groups[it.group].packed);
  assert.equal(Object.keys(atlas.frames).length, packed.length);
  assert.ok(atlas.frames.kit_panel && atlas.frames.icon_bar_knife && atlas.frames.portrait_scout_hurt);
  assert.ok(!atlas.frames.cursor_select && !atlas.frames.title_bg, 'cursors and title images stay out of the atlas');
  assert.deepEqual(atlas.frames.kit_panel.frame, { x: 0, y: 0, w: 96, h: 96 });
  assert.equal(atlas.meta.scale, '2');
  // No two packed frames overlap and all lie inside the sheet.
  const rects = Object.values(atlas.frames).map((f) => (f as { frame: { x: number; y: number; w: number; h: number } }).frame);
  for (const [i, a] of rects.entries()) {
    assert.ok(a.x + a.w <= atlas.meta.size.w && a.y + a.h <= atlas.meta.size.h);
    for (const b of rects.slice(i + 1)) assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'frames overlap');
  }
  assert.match(run('standins', root).out, /Wrote 0 new/);

  const inbox = join(root, 'art', 'inbox', 'U1', 'ui');
  mkdirSync(inbox, { recursive: true });
  writeFileSync(join(inbox, 'kit_panel.png'), blankPng(96, 96));
  writeFileSync(join(inbox, 'cursor_move.png'), blankPng(32, 32));
  const ok = run('pack', root, 'U1');
  assert.equal(ok.code, 0, ok.err);
  assert.match(ok.out, /Installed 2 frames/);
  assert.equal(standinList(root).ui.length, items.length - 2);
  assert.ok(!standinList(root).ui.includes('kit_panel.png'));
});

test('pack rejects UI files that are unknown or the wrong size, naming the file', () => {
  for (const [file, w, h, expected] of [
    ['kit_panel.png', 48, 48, /ui\/kit_panel\.png: size 48x48, expected 96x96/],
    ['kit_dragon.png', 96, 96, /ui\/kit_dragon\.png: not a UI item/],
    ['kit_panel.jpg', 96, 96, /ui\/kit_panel\.jpg: not a UI item/],
  ] as [string, number, number, RegExp][]) {
    const root = makeRoot();
    run('standins', root);
    const inbox = join(root, 'art', 'inbox', 'U2', 'ui');
    mkdirSync(inbox, { recursive: true });
    writeFileSync(join(inbox, file), blankPng(w, h));
    const r = run('pack', root, 'U2');
    assert.equal(r.code, 1, file);
    assert.match(r.err, expected, file);
    assert.match(r.err, /nothing installed/, file);
  }
});

/** A temp root whose manifest marks the scout atlas as a 2x sheet (128 px cells). */
function makeRoot2x(): string {
  const root = makeRoot();
  const file = join(root, 'art', 'manifest.json');
  const m = JSON.parse(readFileSync(file, 'utf8'));
  m.atlases.scout.scale = 2;
  writeFileSync(file, JSON.stringify(m));
  return root;
}

const sizeOf = (file: string) => [readFileSync(file).readUInt32BE(16), readFileSync(file).readUInt32BE(20)];

test('a 2x sheet gets 128 px stand-ins and a 128 px atlas; 1x sheets stay 64 px', () => {
  const root = makeRoot2x();
  const r = run('standins', root);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(sizeOf(join(root, 'art', 'frames', 'scout', 'walk_se_0.png')), [128, 128]);
  assert.deepEqual(sizeOf(join(root, 'art', 'frames', 'fighter', 'walk_se_0.png')), [64, 64]);
  const scout = JSON.parse(readFileSync(join(root, 'art', 'atlas', 'scout.json'), 'utf8'));
  assert.equal(Object.keys(scout.frames).length, 66);
  assert.equal(scout.meta.scale, '2');
  for (const f of Object.values(scout.frames) as { frame: { w: number; h: number } }[]) assert.deepEqual([f.frame.w, f.frame.h], [128, 128]);
  assert.deepEqual(sizeOf(join(root, 'art', 'atlas', 'scout.png')), [8 * 128, 9 * 128]);
  const fighter = JSON.parse(readFileSync(join(root, 'art', 'atlas', 'fighter.json'), 'utf8'));
  assert.deepEqual([fighter.frames['fighter_idle_se_0'].frame.w, fighter.meta.scale], [64, '1']);
});

test('pack on a 2x sheet expects 128 px frames, rejects 64 px ones, and redraws left-over stand-ins at 128 px', () => {
  const root = makeRoot();
  run('standins', root); // 1x stand-ins first, as when the sheet is switched to 2x later
  const m = JSON.parse(readFileSync(join(root, 'art', 'manifest.json'), 'utf8'));
  m.atlases.scout.scale = 2;
  writeFileSync(join(root, 'art', 'manifest.json'), JSON.stringify(m));
  const inbox = join(root, 'art', 'inbox', 'T2', 'scout');
  mkdirSync(inbox, { recursive: true });
  copyFileSync(join(root, 'art', 'frames', 'scout', 'walk_se_0.png'), join(inbox, 'idle_se_0.png')); // still 64x64
  const bad = run('pack', root, 'T2');
  assert.equal(bad.code, 1);
  assert.match(bad.err, /scout\/idle_se_0\.png: size 64x64, expected 128x128/);

  writeFileSync(join(inbox, 'idle_se_0.png'), blankPng(128, 128));
  const ok = run('pack', root, 'T2');
  assert.equal(ok.code, 0, ok.err);
  assert.deepEqual(sizeOf(join(root, 'art', 'frames', 'scout', 'idle_se_0.png')), [128, 128]);
  assert.deepEqual(sizeOf(join(root, 'art', 'frames', 'scout', 'walk_se_0.png')), [128, 128]); // the old 1x stand-in was redrawn
  assert.equal(standinList(root).scout.length, 65);
  const scout = JSON.parse(readFileSync(join(root, 'art', 'atlas', 'scout.json'), 'utf8'));
  assert.equal(Object.keys(scout.frames).length, 66);
  assert.deepEqual(sizeOf(join(root, 'art', 'atlas', 'scout.png')), [8 * 128, 9 * 128]);
});

test('pack installs environment art at its 2x source size and rejects a wrong size or an unknown key', () => {
  const root = makeRoot();
  const inbox = join(root, 'art', 'inbox', 'E1', 'env');
  mkdirSync(inbox, { recursive: true });
  writeFileSync(join(inbox, 'ground_moss.png'), blankPng(128, 64));
  writeFileSync(join(inbox, 'tree_a.png'), blankPng(56, 144));
  const ok = run('pack', root, 'E1');
  assert.equal(ok.code, 0, ok.err);
  assert.match(ok.out, /Installed 2 frames/);
  assert.ok(existsSync(join(root, 'art', 'frames', 'env', 'ground_moss.png')) && existsSync(join(root, 'art', 'frames', 'env', 'tree_a.png')));

  writeFileSync(join(inbox, 'tree_b.png'), blankPng(28, 72)); // the 1x size of a tree
  writeFileSync(join(inbox, 'dragon.png'), blankPng(64, 64));
  const bad = run('pack', root, 'E1');
  assert.equal(bad.code, 1);
  assert.match(bad.err, /env\/tree_b\.png: size 28x72, expected 56x144/);
  assert.match(bad.err, /env\/dragon\.png: not an environment key/);
  assert.ok(!existsSync(join(root, 'art', 'frames', 'env', 'tree_b.png')), 'nothing from a failed batch is installed');
});

// The claim guard (WORKFLOW.md *Shared-checkout coordination*): a generator stops while the other agent's
// *Working on* names the manifest, the stand-in list or the atlases.
test('art:standins stops while the other agent claims the shared art files', async () => {
  const lib = '../scripts/art/lib.mjs'; // a variable path: the script has no type declarations
  const { otherClaims } = (await import(lib)) as { otherClaims: (root: string, env: Record<string, string>) => string[] };
  const root = mkdtempSync(join(tmpdir(), 'dw-claims-'));
  temps.push(root);
  mkdirSync(join(root, 'handoff'));
  const codex = (working: string) => writeFileSync(join(root, 'handoff', 'from-codex.md'), `# Codex

## Working on
${working}
## Awaiting the user
- the UI atlas pair waits
`);
  const claude = { CLAUDECODE: '1' };
  codex('- A18: installing the UI atlas pair and the manifest entry.');
  assert.equal(otherClaims(root, claude).length, 1);
  assert.equal(otherClaims(root, {}).length, 0); // Codex is not checked against its own claims
  codex('- None. A18 installation claims released.');
  assert.equal(otherClaims(root, claude).length, 0);
  codex('- E6 done; manifest updated, no claims held.\n- Drawing portraits in art/inbox/A16/.');
  assert.equal(otherClaims(root, claude).length, 0); // only lines naming the shared files count; a later section never does
  codex('- Z85 done: biosPage.ts and a manifest key, uncommitted.');
  assert.equal(otherClaims(root, claude).length, 0); // a done note is not a claim
  codex('- Claimed: art/frames/standins.json.');
  const run = (...extra: string[]) => spawnSync(process.execPath, [join(project, 'scripts', 'art', 'standins.mjs'), '--root', root, ...extra], { env: { ...process.env, CLAUDECODE: '1' }, encoding: 'utf8' });
  const stopped = run();
  assert.equal(stopped.status, 2, stopped.stderr);
  assert.match(stopped.stderr, /standins.json/);
  assert.ok(!existsSync(join(root, 'art', 'atlas')), 'nothing written');
});
