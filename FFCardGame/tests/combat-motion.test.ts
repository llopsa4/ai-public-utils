import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../client/src/content/cards';
import { cardMotion, actionFeedback } from '../client/src/hooks/useBattle';
import type { CardType } from '../client/src/game/types';

test('only attacking cards advance toward the enemy; signature and piston retain distinct motion', () => {
  for (const type of Object.keys(CARDS) as CardType[]) {
    const motion = cardMotion({type, id:'motion-check'});
    assert.equal(['strike','heavy','pulse'].includes(motion), !!CARDS[type].damage, type);
    if(type !== 'pulse') assert.equal(['strike','heavy','pulse'].includes(cardMotion({type,id:'refined-motion',upgrade:'refined'})), !!CARDS[type].damage, `refined ${type}`);
  }
  assert.equal(cardMotion({type:'pulse',id:'signature'}), 'pulse');
  assert.equal(cardMotion({type:'pulse',id:'trained-signature',upgrade:'tempered-flow'}), 'pulse');
  assert.equal(cardMotion({type:'piston',id:'piston'}), 'heavy');
});


import { createBattle, playCard } from '../client/src/game/combat';
import { PROTOTYPE_PROFILE, PROTOTYPE_ENCOUNTER } from '../client/src/content/encounter';

test('draw feedback reports actual cards drawn, including an empty deck', () => {
  for(const available of [0,1]){
    const card={type:'return-stroke' as const,id:'return'};
    const strike={type:'strike' as const,id:'spare'};
    const state=createBattle({...PROTOTYPE_PROFILE,deck:available?[card,strike]:[card]},PROTOTYPE_ENCOUNTER,1);
    state.hand=[card];state.draw=available?[strike]:[];state.discard=[];
    const next=playCard(state,card.id);
    assert.equal(actionFeedback(state,next,card).text,available?'+1 CARD':'NO CARDS TO DRAW');
  }
});
test('a fully blocked attack reports block contact rather than HP damage', () => {
  const card={type:'strike' as const,id:'strike'};
  const state=createBattle({...PROTOTYPE_PROFILE,deck:[card]},PROTOTYPE_ENCOUNTER,1);state.enemy.block=6;
  const next=playCard(state,card.id);
  assert.match(actionFeedback(state,next,card).text,/BLOCKED/);
  assert.doesNotMatch(actionFeedback(state,next,card).text,/6 DAMAGE/);
});
test('signature overload feedback retains attack, block and self-damage effects together', () => {
  const card={type:'pulse' as const,id:'pulse'};
  const state=createBattle({...PROTOTYPE_PROFILE,deck:[card]},PROTOTYPE_ENCOUNTER,1);state.strain=8;
  const next=playCard(state,card.id),feedback=actionFeedback(state,next,card);
  assert.match(feedback.text,/18 HP/);assert.match(feedback.text,/6 BLOCK/);assert.match(feedback.text,/OVERLOAD.*6 HP/);
});
