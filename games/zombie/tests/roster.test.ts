import assert from 'node:assert/strict';
import { test } from 'node:test';
import chars from '../src/data/characters.json';
import { dialoguePortrait, portraitKey, smallPortraitKey, speakerWho, squadPortrait, uiItem } from '../src/render/ui';
import { selectWeapon } from '../src/sim/abilities';
import { weapon } from '../src/sim/combat';
import { SURVIVOR_NAME, createMission, newSurvivor, orderAttack, stepMission } from '../src/sim/mission';
import { traitLine } from '../src/sim/traits';
import manifest from '../art/manifest.json';
import base1 from '../src/data/base1.json';
import intro from '../src/data/intro.json';
import m01 from '../src/data/missions/m01.json';

// Z79: Ray (`hunter`) and June (`archer`) are wired in as survivor kinds (DESIGN §5).

test('Ray and June are named, and every player-visible name maps to a survivor', () => {
  assert.equal(SURVIVOR_NAME.hunter, 'Ray');
  assert.equal(SURVIVOR_NAME.archer, 'June');
  assert.equal(speakerWho('Ray'), 'hunter');
  assert.equal(speakerWho(' june '), 'archer');
  assert.equal(speakerWho('Cass'), 'fighter');
  assert.equal(speakerWho('Nobody'), null);
});

test('each new survivor starts with the bow, the shared pistol and their own melee weapon', () => {
  const ray = newSurvivor('r', 'hunter', 3, 3);
  const june = newSurvivor('j', 'archer', 4, 4);
  assert.deepEqual(ray.weapons, ['bow', 'pistol', 'hatchet']);
  assert.deepEqual(june.weapons, ['bow', 'pistol', 'warclub']);
  assert.equal(ray.weapon, 'bow');
  assert.equal(june.weapon, 'bow');
  assert.ok(ray.hp > 0 && ray.hp === ray.maxHp && june.hp === june.maxHp);
});

test('hatchet and war club match DESIGN §5: range 1.5, silent, 30 / 25 damage, 1.5 s / 1 s', () => {
  assert.deepEqual({ ...weapon('hatchet'), act: undefined }, { id: 'hatchet', range: 1.5, damage: 30, noise: 0, cooldown: 1.5, act: undefined });
  assert.deepEqual({ ...weapon('warclub'), act: undefined }, { id: 'warclub', range: 1.5, damage: 25, noise: 0, cooldown: 1, act: undefined });
  assert.equal(weapon('hatchet').act, 'hatchet');
  assert.equal(weapon('warclub').act, 'club');
});

test('Ray swings the hatchet and June the war club: damage, silence and the animation cue', () => {
  const open = Array.from({ length: 20 }, () => '.'.repeat(20));
  const s = createMission({
    map: open,
    extract: { x: 0, y: 0, w: 1, h: 1 },
    survivors: [{ id: 'r', kind: 'hunter', x: 10, y: 10 }, { id: 'j', kind: 'archer', x: 10, y: 14 }],
    enemies: [{ id: 'z1', kind: 'zombie', x: 11, y: 10 }, { id: 'z2', kind: 'zombie', x: 11, y: 14 }],
  });
  assert.ok(selectWeapon(s, 'r', 'hatchet'));
  assert.ok(selectWeapon(s, 'j', 'warclub'));
  orderAttack(s, ['r'], 'z1');
  orderAttack(s, ['j'], 'z2');
  for (let i = 0; i < 4; i++) stepMission(s);
  const z1 = s.enemies.find((e) => e.id === 'z1')!;
  const z2 = s.enemies.find((e) => e.id === 'z2')!;
  assert.equal(z1.hp, 60 - 30);
  assert.equal(z2.hp, 60 - 25);
  assert.equal(s.survivors[0]!.act?.kind, 'hatchet');
  assert.equal(s.survivors[1]!.act?.kind, 'club');
  assert.ok(!s.noises.some((n) => n.kind === 'shot' && n.radius > 0), 'both are silent');
});

test('trait lines name Ray and June and read the numbers from characters.json', () => {
  assert.match(traitLine('Ray'), /Tracker.*6 tiles/);
  assert.match(traitLine('June'), /quick draw.*0\.75 s/);
  assert.equal(chars.hunter.tracker.radius, 6);
  assert.equal(chars.archer.quickDraw.bowCooldown, 0.75);
});

test('Ray and June have portraits in the four moods and the two card heads, all in the manifest', () => {
  for (const who of ['hunter', 'archer'] as const) {
    for (const mood of ['neutral', 'afraid', 'determined', 'hurt'] as const) assert.ok(uiItem(portraitKey(who, mood)), `${who} ${mood}`);
    for (const hurt of [false, true]) assert.ok(uiItem(smallPortraitKey(who, hurt)), `${who} small`);
  }
  assert.equal(dialoguePortrait('Ray', 'afraid'), 'portrait_hunter_afraid');
  assert.equal(dialoguePortrait('June', undefined), 'portrait_archer_neutral');
  assert.equal(squadPortrait('June', 10, 90), 'portrait_archer_hurt');
});

test('the manifest registers final figures and arrows for Ray and June', () => {
  const figs = manifest.figures.keys as Record<string, { atlas: string; legacyKey: string; status: string; anims: Record<string, number> }>;
  for (const [key, melee] of [['hunter', 'hatchet'], ['archer', 'club']] as const) {
    const f = figs[key]!;
    assert.equal(f.status, 'final');
    assert.equal(f.atlas, key);
    assert.equal(manifest.atlases[key].scale, 2, `${key} atlas scale`);
    assert.ok((manifest.keys as Record<string, unknown>)[f.legacyKey], f.legacyKey);
    for (const a of ['idle', 'walk', 'run', 'crouch', 'crawl', 'hold', 'work', 'death', 'pistol_shot', 'bow_shot', melee]) assert.ok(f.anims[a], `${key} ${a}`);
  }
  for (const key of ['arrow_fly', 'arrow_ground'] as const) {
    assert.equal(manifest.keys[key].group, 'env');
    assert.equal(manifest.keys[key].status, 'final');
  }
});

// Z90: Theo (`tinkerer`) is wired in, but no scene puts him in the squad yet: he joins at Mission 2's bunker door (DESIGN §25).

test('Theo is named, speaks with his own portrait and has a trait line', () => {
  assert.equal(SURVIVOR_NAME.tinkerer, 'Theo');
  assert.equal(speakerWho('Theo'), 'tinkerer');
  assert.match(traitLine('Theo'), /Resourceful/);
  for (const mood of ['neutral', 'afraid', 'determined', 'hurt'] as const) assert.ok(uiItem(portraitKey('tinkerer', mood)), mood);
  for (const hurt of [false, true]) assert.ok(uiItem(smallPortraitKey('tinkerer', hurt)));
});

test('Theo carries the pistol and the shovel, and is the most fragile and slowest survivor (DESIGN §5)', () => {
  const theo = newSurvivor('t', 'tinkerer', 3, 3);
  assert.deepEqual(theo.weapons, ['pistol', 'shovel']);
  assert.equal(theo.weapon, 'pistol');
  assert.equal(theo.arrows, undefined);
  assert.equal(theo.hp, 70);
  for (const other of ['fighter', 'scout', 'hunter', 'archer'] as const) {
    assert.ok(chars.tinkerer.hp < chars[other].hp, `${other} hp`);
    assert.ok(chars.tinkerer.speed.walk < chars[other].speed.walk, `${other} walk`);
    assert.ok(chars.tinkerer.speed.run < chars[other].speed.run, `${other} run`);
  }
  assert.equal(weapon('shovel').act, 'shovel');
  assert.equal(weapon('shovel').noise, 0);
  assert.ok(uiItem('icon_bar_shovel'));
});

test('no scene puts Theo in the squad yet', () => {
  for (const spec of [m01, base1, intro]) assert.ok(!JSON.stringify(spec).includes('tinkerer'));
});

test('the manifest registers Theo’s figure with the A16 anims', () => {
  const f = (manifest.figures.keys as Record<string, { atlas: string; legacyKey: string; anims: Record<string, number> }>).tinkerer!;
  assert.equal(f.atlas, 'tinkerer');
  assert.ok((manifest.keys as Record<string, unknown>)[f.legacyKey]);
  for (const a of ['idle', 'walk', 'run', 'crouch', 'crawl', 'hold', 'work', 'death', 'pistol_shot', 'shovel']) assert.ok(f.anims[a], a);
});
