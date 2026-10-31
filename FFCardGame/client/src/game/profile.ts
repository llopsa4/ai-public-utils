// Pure preparation hooks. Campaign transitions own eligibility and one-time grants.
import { cardDefinition } from '../content/cards';
import type { CharacterProfile } from './types';
import { deriveStats } from './equipment';

export function learnTemperedFlow(profile: CharacterProfile, instanceId: string): CharacterProfile {
  const matches = profile.deck.filter(card => card.id === instanceId);
  if (matches.length !== 1 || matches[0].type !== 'pulse') throw new Error('Tempered Flow requires one owned Kiln Pulse instance');
  const card = matches[0];
  cardDefinition(card);
  if (card.upgrade === 'tempered-flow') return profile;
  return { ...profile, deck: profile.deck.map(item => item.id === instanceId ? { ...item, upgrade: 'tempered-flow' } : { ...item }) };
}

export function recoverMP(profile: CharacterProfile, amount: number): CharacterProfile {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('MP recovery must be a nonnegative integer');
  const maximum = deriveStats(profile).maxMp;
  if (!Number.isSafeInteger(profile.mp) || profile.mp < 0 || profile.mp > maximum) {
    throw new Error('Invalid profile MP');
  }
  const mp = profile.mp + Math.min(amount, maximum - profile.mp);
  return mp === profile.mp ? profile : { ...profile, mp };
}
