import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import bios from '../src/data/bios.json';
import { checkpointOf, createBase } from '../src/sim/base';
import { BEATS, BIO_ORDER, type Beat, bioTabs, progressOfBase, progressOfIntro, progressOfMission, progressOfSave } from '../src/sim/bios';
import { STAGES, newCampaign, parseSave, saveCampaign, toBase1, toDone, toMission1, withCheckpoint } from '../src/sim/campaign';
import { uiOf } from '../src/render/ui';
import { newSurvivor } from '../src/sim/mission';
import { createIntro } from '../src/sim/tutorial';

/** Every beat the story reaches today: up to Base 1's end. The Mission 2 flow (PLAN Z100) adds the rest. */
const TO_DONE = BEATS.slice(0, BEATS.indexOf('done') + 1);

// Z84: which Bios tabs and entries each point of the story shows (DESIGN §24).

const kinds = (p: ReturnType<typeof progressOfSave>) => bioTabs(p).map((t) => t.kind);
const beatsOf = (p: ReturnType<typeof progressOfSave>, kind: string) => bioTabs(p).find((t) => t.kind === kind)?.entries.map((e) => e.beat);

test('the save names how far the story got: tabs in join order, entries only for beats reached and lived', () => {
  const c = newCampaign();
  assert.deepEqual(kinds(progressOfSave(c)), ['fighter']); // New game: Cass alone, before Eli's arrival
  assert.deepEqual(beatsOf(progressOfSave(c), 'fighter'), ['intro']);

  const m1 = toMission1(c, 3);
  assert.deepEqual(kinds(progressOfSave(m1)), ['fighter', 'scout']);
  assert.deepEqual(beatsOf(progressOfSave(m1), 'scout'), ['intro', 'mission1']);

  const b1 = toBase1(m1, { food: 0, scrap: 0, ammo: 0 });
  assert.deepEqual(kinds(progressOfSave(b1)), ['fighter', 'scout', 'hunter', 'archer']);
  assert.deepEqual(beatsOf(progressOfSave(b1), 'fighter'), ['intro', 'mission1', 'rescue', 'base1']);
  assert.deepEqual(beatsOf(progressOfSave(b1), 'hunter'), ['rescue', 'base1']);
  assert.deepEqual(beatsOf(progressOfSave(b1), 'archer'), ['rescue', 'base1']);

  const done = toDone(b1);
  assert.deepEqual(beatsOf(progressOfSave(done), 'fighter'), TO_DONE);
  assert.deepEqual(beatsOf(progressOfSave(done), 'archer'), ['rescue', 'base1', 'herd', 'done']);
});

test('a herd checkpoint in the save shows the herd entry, and not the last one', () => {
  const b = createBase();
  b.herd.warned = true;
  const cp = checkpointOf(b);
  assert.ok(cp);
  const c = withCheckpoint(toBase1(toMission1(newCampaign(), 3), { food: 0, scrap: 0, ammo: 0 }), cp);
  for (const kind of ['fighter', 'scout']) assert.deepEqual(beatsOf(progressOfSave(c), kind), ['intro', 'mission1', 'rescue', 'base1', 'herd']);
  for (const kind of ['hunter', 'archer']) assert.deepEqual(beatsOf(progressOfSave(c), kind), ['rescue', 'base1', 'herd']);
});

test('a real saved slot reads back to the same tabs', () => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  const c = toBase1(toMission1(newCampaign(), 3), { food: 0, scrap: 0, ammo: 0 });
  assert.ok(saveCampaign(storage, c));
  const back = parseSave(storage.getItem('deadwoods.save'));
  assert.ok(back);
  assert.deepEqual(bioTabs(progressOfSave(back)), bioTabs(progressOfSave(c)));
});

test('every stage gives at least Cass, and later stages never lose a tab or an entry', () => {
  let before = 0;
  let beforeEntries = 0;
  for (const stage of STAGES) {
    const tabs = bioTabs(progressOfSave({ stage, checkpoint: null }));
    const entries = tabs.reduce((n, t) => n + t.entries.length, 0);
    assert.ok(tabs.length >= 1 && tabs[0]!.kind === 'fighter');
    assert.ok(tabs.length >= before && entries >= beforeEntries, stage);
    before = tabs.length;
    beforeEntries = entries;
  }
});

test('the Intro pause: Cass only until Eli walks into the camp, then Cass and Eli', () => {
  const s = createIntro();
  assert.deepEqual(kinds(progressOfIntro(s)), ['fighter']);
  s.survivors.push(newSurvivor('scout', 'scout', 38, 34));
  assert.deepEqual(kinds(progressOfIntro(s)), ['fighter', 'scout']);
  assert.deepEqual(beatsOf(progressOfIntro(s), 'scout'), ['intro']);
});

test('the Mission 1 pause shows Cass and Eli up to the mission start', () => {
  assert.deepEqual(kinds(progressOfMission()), ['fighter', 'scout']);
  assert.deepEqual(beatsOf(progressOfMission(), 'fighter'), ['intro', 'mission1']);
});

test('the Base 1 pause: the herd entry from the warning, the last entry only after the win', () => {
  const s = createBase();
  assert.deepEqual(beatsOf(progressOfBase(s), 'scout'), ['intro', 'mission1', 'rescue', 'base1']);
  assert.deepEqual(kinds(progressOfBase(s)), ['fighter', 'scout', 'hunter', 'archer']);
  s.herd.warned = true;
  assert.deepEqual(beatsOf(progressOfBase(s), 'hunter'), ['rescue', 'base1', 'herd']);
  s.status = 'success';
  assert.deepEqual(beatsOf(progressOfBase(s), 'hunter'), ['rescue', 'base1', 'herd', 'done']);
  assert.deepEqual(beatsOf(progressOfBase(s), 'fighter'), TO_DONE);
});

test('tabs carry the header fields: full name, age, role, and the Dakota name for Ray and June only', () => {
  const tabs = bioTabs(progressOfSave(toDone(newCampaign())));
  assert.deepEqual(tabs.map((t) => [t.name, t.fullName, t.age]), [['Cass', 'Cass Mireles', 34], ['Eli', 'Eli Varga', 24], ['Ray', 'Ray Bluestone', 40], ['June', 'June Bluestone', 15]]);
  assert.ok(tabs.every((t) => t.role.length > 0 && t.background.length > 0));
  assert.deepEqual(tabs.map((t) => t.dakota), [null, null, { name: 'Tahca Wanyaka', meaning: 'Sees the Deer' }, { name: 'Wakpa Win', meaning: 'River Woman' }]);
});

test('no secrets: Cass\'s brother and Eli\'s mum appear nowhere in the bios', () => {
  const text = JSON.stringify(bios).toLowerCase();
  for (const word of ['brother', 'sibling', 'mum', 'mom', 'mother', 'eldest', 'nurse', 'two valleys']) assert.ok(!text.includes(word), word);
});

test('Theo has no tab until the bunker door opens; then he is last, with entries from that beat on', () => {
  assert.ok(!kinds(progressOfSave(toDone(newCampaign()))).includes('tinkerer'));
  const at = (last: Beat) => ({ beats: BEATS.slice(0, BEATS.indexOf(last) + 1), eli: true });
  assert.deepEqual(kinds(at('bunker')), ['fighter', 'scout', 'hunter', 'archer', 'tinkerer']);
  assert.deepEqual(beatsOf(at('bunker'), 'tinkerer'), ['bunker']);
  assert.deepEqual(beatsOf(at('hut'), 'tinkerer'), ['bunker', 'base2', 'hut']);
  const { name, fullName, age, dakota } = bioTabs(at('bunker')).at(-1)!;
  assert.deepEqual([name, fullName, age, dakota], ['Theo', 'Theo Nakamura', 31, null]);
});

test("Ray's hut is not named before the group arrives there", () => {
  for (const [kind, raw] of Object.entries(bios)) {
    const early = [raw.background, ...Object.entries(raw.entries).filter(([beat]) => beat !== 'hut').map(([, text]) => text)];
    for (const text of early) assert.ok(!/(hut|shack)/i.test(text), `${kind}: ${text}`);
  }
});

test('every entry is a lived beat and short enough for the page', () => {
  const lived: Record<string, readonly Beat[]> = {
    fighter: TO_DONE,
    scout: TO_DONE,
    hunter: ['rescue', 'base1', 'herd', 'done'],
    archer: ['rescue', 'base1', 'herd', 'done'],
    tinkerer: ['bunker', 'base2', 'hut'],
  };
  for (const [kind, raw] of Object.entries(bios)) {
    assert.deepEqual(Object.keys(raw.entries), lived[kind], kind);
    for (const text of Object.values(raw.entries)) assert.ok(text.length > 0 && text.length <= 420, `${kind}: ${text.length}`);
  }
});

test('the JSON copies the approved Bio blocks of DESIGN-characters.md verbatim', () => {
  const md = readFileSync(new URL('../DESIGN-characters.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const blocks = md.split(/^### Bio .*$/m).slice(1).map((b) => b.split(/^#{1,3} /m)[0]!);
  const order = ['fighter', 'scout', 'hunter', 'archer', 'tinkerer'] as const;
  assert.equal(blocks.length, order.length);
  blocks.forEach((block, i) => {
    const raw = bios[order[i]!];
    const items = block.split(/^- \*\*/m).slice(1).map((it) => {
      const m = /^`?([A-Za-z0-9]+)`?:\*\*\s*([\s\S]*)$/.exec(it);
      assert.ok(m, it);
      return [m![1]!.toLowerCase(), m![2]!.replace(/\s+/g, ' ').trim()] as const;
    });
    const doc = Object.fromEntries(items);
    assert.equal(doc.background, raw.background, `${order[i]} background`);
    for (const [beat, text] of Object.entries(raw.entries)) assert.equal(doc[beat], text, `${order[i]} ${beat}`);
    assert.deepEqual(items.map(([k]) => k), ['background', ...Object.keys(raw.entries)], order[i]);
  });
});

test('every survivor has a bio figure key in the manifest (a placeholder until Codex installs the crop, A15)', () => {
  for (const kind of BIO_ORDER) {
    const it = uiOf(`bio_${kind}`);
    assert.equal(it.group, 'bio');
    assert.equal(it.packed, false); // a standalone image, not in the ui atlas
    assert.deepEqual([...it.size], [384, 512]);
  }
});
