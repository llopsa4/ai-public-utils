import type { EncounterDefinition, RewardCardType } from '../game/types';
import { PROTOTYPE_ENCOUNTER } from './encounter';

export const REWARD_POOL: readonly RewardCardType[] = ['measured-drive','fitted-brace','ember-hook','return-stroke','pressure-return'];
export const ROUTE_ENCOUNTERS: Readonly<Record<string,EncounterDefinition>> = {
  'route-ash-way': { ...PROTOTYPE_ENCOUNTER, id:'ashway-sweeper', title:'ASHWAY', enemy:{ name:'Ash Sweeper',label:'Sweeper',maxHp:34,intents:[{name:'Sweep',damage:5,block:0},{name:'Ash guard',damage:3,block:3},{name:'Brush surge',damage:7,block:0}]},introduction:'The sweeper circles a blocked pipe.',victoryText:'The machine settles. The passage is clear.' },
  'route-pressure-way': { ...PROTOTYPE_ENCOUNTER, id:'pressure-scavenger',title:'PRESSURE WALK',enemy:{name:'Pressure Scavenger',label:'Scavenger',maxHp:42,intents:[{name:'Collect',damage:4,block:0},{name:'Brace',damage:2,block:5},{name:'Discharge',damage:10,block:0}]},introduction:'A scavenger gathers the scattered pipework.',victoryText:'Its collection arms fold. You can pass.' },
  'route-teacher': { ...PROTOTYPE_ENCOUNTER,id:'training-rig',title:'PRACTICE RIG',enemy:{name:'Training Rig',label:'Rig',maxHp:24,intents:[{name:'Practice sweep',damage:4,block:0}]},introduction:'A guarded rig gives you room to practice.',victoryText:'The rig stops. Your gauntlet feels steadier.' },
};
export function rewardId(nodeId:string) { return `${nodeId}:reward`; }
