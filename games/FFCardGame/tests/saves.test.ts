import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { campaignTransition, newCampaign, type CampaignState } from '../client/src/game/campaign';
import { CHECKPOINT_CLAIM, CHECKPOINT_NODE } from '../client/src/content/campaign';
import { cardAvailability, preview } from '../client/src/game/combat';
import { decodeSave, encodeSave, readSave, SAVE_KEY, writeSave } from '../client/src/persistence/campaign';
import { TUTORIAL_KEY } from '../client/src/persistence/preferences';

const date = '2026-10-31T12:00:00.000Z';
function enter() { return campaignTransition(newCampaign(19, false), { type: 'enter', nodeId: CHECKPOINT_NODE, revision: 0 }); }
function advance(state: CampaignState, win: boolean) {
  const battle = state.battle!;
  const card = win ? battle.hand.filter(c => cardAvailability(battle, c).affordable).sort((a,b) => preview(battle,b).damage - preview(battle,a).damage)[0] : undefined;
  return campaignTransition(state, card ? { type: 'play', cardId: card.id, revision: state.revision, battleRevision: battle.revision }
    : { type: 'end-turn', revision: state.revision, battleRevision: battle.revision });
}
function roundtrip(state: CampaignState) { assert.deepEqual(decodeSave(encodeSave(state, date)).state, state); }

test('save v1 round-trips ready, every action, terminal, pending claim and completion', () => {
  roundtrip(newCampaign(19));
  let state = enter();
  roundtrip(state);
  for (let i = 0; i < 300 && !state.battle!.outcome; i++) { state = advance(state, true); roundtrip(state); }
  assert.equal(state.battle!.outcome, 'victory');
  state = campaignTransition(state, { type: 'resolve', revision: state.revision });
  roundtrip(state);
  const restored = decodeSave(encodeSave(state, date)).state;
  state = campaignTransition(restored, { type: 'claim', claimId: CHECKPOINT_CLAIM, revision: restored.revision });
  roundtrip(state);
  assert.equal(campaignTransition(decodeSave(encodeSave(state, date)).state, { type: 'claim', claimId: CHECKPOINT_CLAIM, revision: state.revision }).revision, state.revision);
});
test('mid-battle reload preserves subsequent draws and exact defeat retry including RNG', () => {
  let state = advance(advance(enter(), false), false);
  const restored = decodeSave(encodeSave(state, date)).state;
  assert.deepEqual(advance(state, false), advance(restored, false));
  while (!state.battle!.outcome) state = advance(state, false);
  roundtrip(state);
  state = decodeSave(encodeSave(state, date)).state;
  assert.equal(state.battle!.outcome, 'defeat');
  const retried = campaignTransition(state, { type: 'retry', revision: state.revision });
  assert.deepEqual(retried.battle, enter().battleStart);
  roundtrip(retried);
});
test('malformed, future, oversized, unknown-content and inconsistent saves fail without modifying current state', () => {
  const state = enter(), original = structuredClone(state);
  const envelope = JSON.parse(encodeSave(state, date));
  const mutations = [
    (v: typeof envelope) => { v.version = 99; },
    (v: typeof envelope) => { v.contentVersion = 'future'; },
    (v: typeof envelope) => { v.state.phase = 'shop'; },
    (v: typeof envelope) => { v.state.profile.mp = 100; },
    (v: typeof envelope) => { v.state.profile.deck[0].id = 'unknown'; },
    (v: typeof envelope) => { v.state.profile.equipment.gauntlet.id = 'unknown'; },
    (v: typeof envelope) => { v.state.battle.config.encounter.enemy.maxHp = 1; },
    (v: typeof envelope) => { v.state.battle.hand.push(v.state.battle.hand[0]); },
    (v: typeof envelope) => { v.state.battle.rng = -1; },
    (v: typeof envelope) => { v.state.battle.strain = 10; },
    (v: typeof envelope) => { v.state.battle.outcome = 'victory'; },
    (v: typeof envelope) => { v.state.battleStart.draw.reverse(); },
    (v: typeof envelope) => { v.state.claimedRewards.push(CHECKPOINT_CLAIM); },
    (v: typeof envelope) => { v.state.routeDecisions.push('unknown-node'); },
    (v: typeof envelope) => { v.state.revision = 0; },
    (v: typeof envelope) => { v.state.battle.intent = 2; },
  ];
  for (const mutate of mutations) { const value = structuredClone(envelope); mutate(value); assert.throws(() => decodeSave(JSON.stringify(value))); }
  for (const raw of ['{', 'null', '[]', '{}', ' '.repeat(512 * 1024 + 1)]) assert.throws(() => decodeSave(raw));
  assert.deepEqual(state, original);
});
test('read failures and invalid stored saves preserve their original data and old hint key', () => {
  const data = new Map([[SAVE_KEY, '{broken'], [TUTORIAL_KEY, 'true']]);
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  const read = readSave(() => storage);
  assert.equal(read.kind, 'invalid');
  if (read.kind === 'invalid') assert.equal(read.raw, '{broken');
  assert.equal(data.get(SAVE_KEY), '{broken');
  assert.equal(readSave(() => { throw new Error('blocked'); }).kind, 'unavailable');
  assert.equal(readSave(() => undefined).kind, 'unavailable');
  assert.equal(readSave(() => ({ ...storage, getItem: () => { throw new Error('denied'); } })).kind, 'unavailable');
  assert.equal(writeSave(enter(), () => ({ ...storage, setItem: () => { throw new Error('quota'); } })).ok, false);
  assert.equal(writeSave(enter(), () => undefined).ok, false);
  assert.equal(data.get(SAVE_KEY), '{broken');
  assert.equal(data.get(TUTORIAL_KEY), 'true');
  assert.equal(writeSave(enter(), () => storage).ok, true);
  assert.equal(readSave(() => storage).kind, 'valid');
  assert.equal(data.get(TUTORIAL_KEY), 'true');
});
test('first-version fixture is stable and requires an explicit future migration', () => {
  const fixture = readFileSync(new URL('./fixtures/save-v1.json', import.meta.url), 'utf8');
  const save = decodeSave(fixture);
  assert.equal(save.version, 6);
  assert.deepEqual(save.state, newCampaign(19, false));
  assert.deepEqual(decodeSave(encodeSave(save.state, save.savedAt)), save);
});
