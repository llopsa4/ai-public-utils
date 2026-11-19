import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaignTransition, newCampaign, type CampaignState } from '../client/src/game/campaign';
import { CHECKPOINT_CLAIM, CHECKPOINT_NODE } from '../client/src/content/campaign';
import { cardAvailability, preview } from '../client/src/game/combat';

export function entered(seed = 19) {
  const state = newCampaign(seed, false);
  return campaignTransition(state, { type: 'enter', nodeId: CHECKPOINT_NODE, revision: state.revision });
}
export function finish(state: CampaignState, win: boolean) {
  for (let action = 0; action < 300 && !state.battle!.outcome; action++) {
    const battle = state.battle!;
    const card = win ? battle.hand.filter(c => cardAvailability(battle, c).affordable)
      .sort((a, b) => (preview(battle, b).damage + preview(battle, b).block) - (preview(battle, a).damage + preview(battle, a).block))[0] : undefined;
    state = campaignTransition(state, card ? { type: 'play', cardId: card.id, battleRevision: battle.revision, revision: state.revision }
      : { type: 'end-turn', battleRevision: battle.revision, revision: state.revision });
  }
  return state;
}
test('campaign validates route and revisions; accepted commands are immutable', () => {
  const start = newCampaign(19, false), copy = structuredClone(start);
  assert.equal(campaignTransition(start, { type: 'enter', nodeId: 'missing', revision: 0 }), start);
  assert.equal(campaignTransition(start, { type: 'enter', nodeId: CHECKPOINT_NODE, revision: 1 }), start);
  const active = entered();
  assert.equal(campaignTransition(active, { type: 'enter', nodeId: CHECKPOINT_NODE, revision: active.revision }), active);
  const cmd = { type: 'end-turn' as const, revision: active.revision, battleRevision: 0 };
  const next = campaignTransition(active, cmd);
  assert.equal(campaignTransition(next, cmd), next);
  assert.equal(campaignTransition(next, { ...cmd, revision: next.revision }), next);
  assert.deepEqual(start, copy);
  assert.deepEqual(next.battleStart, active.battleStart);
});
test('defeat and explicit retry restore exact RNG/piles/resources without losing prior exploration', () => {
  const active = entered();
  const lost = finish(active, false);
  assert.equal(lost.battle!.outcome, 'defeat');
  assert.equal(campaignTransition(lost, { type: 'resolve', revision: lost.revision }), lost);
  const retried = campaignTransition(lost, { type: 'retry', revision: lost.revision });
  assert.deepEqual(retried.battle, active.battleStart);
  assert.deepEqual(retried.routeDecisions, active.routeDecisions);
  assert.deepEqual(retried.completedNodes, active.completedNodes);
  assert.deepEqual(retried.claimedRewards, []);
  assert.notEqual(retried.battle, retried.battleStart);
  assert.equal(campaignTransition(retried, { type: 'end-turn', revision: active.revision, battleRevision: 0 }), retried);
  const cmd = { type: 'end-turn' as const, revision: active.revision, battleRevision: 0 };
  assert.deepEqual(campaignTransition(active, cmd).battle,
    campaignTransition(retried, { ...cmd, revision: retried.revision }).battle);
  const explored = { ...lost, completedNodes: ['prior-node'], routeDecisions: ['prior-node', ...lost.routeDecisions], claimedRewards: ['prior-claim'] };
  const preserved = campaignTransition(explored, { type: 'retry', revision: explored.revision });
  assert.deepEqual(preserved.completedNodes, explored.completedNodes);
  assert.deepEqual(preserved.routeDecisions, explored.routeDecisions);
  assert.deepEqual(preserved.claimedRewards, explored.claimedRewards);
});
test('victory commits current resources once and checkpoint claim cannot be farmed', () => {
  const won = finish(entered(), true);
  assert.equal(won.battle!.outcome, 'victory');
  const resolved = campaignTransition(won, { type: 'resolve', revision: won.revision });
  assert.equal(resolved.profile.hp, won.battle!.hero.hp);
  assert.equal(resolved.profile.mp, won.battle!.mp);
  assert.deepEqual(resolved.completedNodes, [CHECKPOINT_NODE]);
  assert.equal(campaignTransition(resolved, { type: 'resolve', revision: resolved.revision }), resolved);
  assert.equal(campaignTransition(resolved, { type: 'retry', revision: resolved.revision }), resolved);
  assert.equal(campaignTransition(resolved, { type: 'claim', claimId: 'wrong', revision: resolved.revision }), resolved);
  const claimed = campaignTransition(resolved, { type: 'claim', claimId: CHECKPOINT_CLAIM, revision: resolved.revision });
  assert.equal(claimed.phase, 'complete');
  assert.deepEqual(claimed.claimedRewards, [CHECKPOINT_CLAIM]);
  assert.equal(campaignTransition(claimed, { type: 'claim', claimId: CHECKPOINT_CLAIM, revision: claimed.revision }), claimed);
  assert.equal(campaignTransition(claimed, { type: 'enter', nodeId: CHECKPOINT_NODE, revision: claimed.revision }), claimed);
});
