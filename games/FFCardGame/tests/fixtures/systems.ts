import assert from 'node:assert/strict';
import { campaignTransition, newCampaign, type CampaignState, type CampaignCommand } from '../../client/src/game/campaign';
import { LESSON_STEPS } from '../../client/src/content/tutorial';
import { decodeSave, encodeSave } from '../../client/src/persistence/campaign';
import { battleAction } from './progression';

type Action = CampaignCommand extends infer C ? C extends CampaignCommand ? Omit<C,'revision'> : never : never;
export const act=(state:CampaignState,command:Action)=>campaignTransition(state,{...command,revision:state.revision} as CampaignCommand);
export const roundtrip=(state:CampaignState)=>assert.deepEqual(decodeSave(encodeSave(state)).state,state);
export function skip(state:CampaignState){for(let i=0;i<8&&state.systems?.scene;i++)state=act(state,{type:'scene-skip'});return state;}
export function prepared(){let state=skip(newCampaign(19,true,true));for(const step of LESSON_STEPS)state=act(state,{type:'lesson',command:{step:state.tutorial!.step,revision:state.tutorial!.revision,action:step.action}});return state;}
export function win(state:CampaignState){for(let i=0;i<200&&state.phase==='battle';i++){assert.notEqual(state.battle!.outcome,'defeat');state=state.battle?.support?.required?act(state,{type:'support',ally:'iven',battleRevision:state.battle.revision}):battleAction(state);}assert.equal(state.phase,'reward');return state;}
export function claim(state:CampaignState){return skip(act(state,{type:'choose-reward',claimId:state.pendingReward!.id,card:null}));}
export function workshopState(){let state=act(prepared(),{type:'choose-node',nodeId:'route-ash-way'});state=act(state,{type:'start-encounter',nodeId:state.currentNode!});state=claim(win(state));state=act(state,{type:'choose-node',nodeId:'route-discovery'});state=act(state,{type:'discover',nodeId:state.currentNode!,option:'salvage'});state=skip(act(state,{type:'choose-node',nodeId:'route-teacher'}));state=act(state,{type:'start-encounter',nodeId:state.currentNode!});state=claim(win(state));return act(state,{type:'choose-node',nodeId:'route-workshop'});}
export function bridgeState(){let state=act(workshopState(),{type:'continue-route',nodeId:'route-workshop'});state=skip(act(state,{type:'choose-node',nodeId:'route-story'}));return act(state,{type:'start-bridge'});}
