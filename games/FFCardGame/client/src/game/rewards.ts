import { REWARD_POOL } from '../content/rewards';
import type { CharacterProfile } from './types';
import { random } from './random';
import { deriveStats } from './equipment';
import { learnTemperedFlow, recoverMP } from './profile';

export function rollCards(seed:number) {
  const state={rng:seed},cards=[...REWARD_POOL];
  for(let i=cards.length-1;i>0;i--){const j=Math.floor(random(state)*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
  return {cards:cards.slice(0,3),rng:state.rng};
}
export function restProfile(profile:CharacterProfile):CharacterProfile {
  return {...profile,hp:Math.min(profile.maxHp,profile.hp+Math.ceil(profile.maxHp*.3)),mp:deriveStats(profile).maxMp};
}
export function trainingProfile(profile:CharacterProfile,hp:number,mp:number):CharacterProfile {
  const grown={...profile,maxHp:profile.maxHp+6,maxMp:profile.maxMp+2,hp:Math.min(profile.maxHp+6,hp+6),mp};
  const restored={...grown,mp:Math.min(deriveStats(grown).maxMp,mp+2)};
  const pulse=restored.deck.find(card=>card.type==='pulse');
  if(!pulse)throw new Error('Training requires the owned signature');
  return learnTemperedFlow(restored,pulse.id);
}
export function victoryProfile(profile:CharacterProfile) { return recoverMP(profile,2); }
