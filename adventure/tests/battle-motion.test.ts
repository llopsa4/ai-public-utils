import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attackPhase, combatDuration, heroPose, isOffensive } from '../src/kc/battleMotion';
import { cardMotion } from '../../FFCardGame/client/src/hooks/useBattle';

test('offensive attacks hold the punch for 500 ms between a 200 ms approach and return', () => {
  for (const motion of ['strike', 'heavy', 'pulse'] as const) {
    assert.equal(isOffensive(motion), true);
    assert.equal(combatDuration(motion), 900);
    assert.deepEqual([0, 199, 200, 699, 700, 899, 900].map(attackPhase),
      ['approach', 'approach', 'contact', 'contact', 'return', 'return', 'idle']);
  }
});

test('Mara rests low, approaches raised, strikes at contact and returns low', () => {
  assert.deepEqual(['idle', 'approach', 'contact', 'return'].map(phase => heroPose(phase as ReturnType<typeof attackPhase>)),
    ['lower', 'upper', 'punch', 'lower']);
});

test('enemy attacks and nonoffensive actions retain their 420 ms feedback', () => {
  for (const motion of ['enemy', 'guard', 'support', 'vent', 'cycle'] as const) {
    assert.equal(isOffensive(motion), false);
    assert.equal(combatDuration(motion), 420);
  }
});

test('real card definitions select the offensive timeline only for damaging cards', () => {
  for (const [type, motion] of [['strike', 'strike'], ['piston', 'heavy'], ['pulse', 'pulse'], ['guard', 'guard'], ['vent', 'vent']] as const) {
    assert.equal(cardMotion({ id: type, type }), motion);
    assert.equal(combatDuration(motion), ['strike', 'piston', 'pulse'].includes(type) ? 900 : 420);
  }
});
