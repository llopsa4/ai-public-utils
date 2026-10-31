import type { CampaignCommand, CampaignState } from './campaign';
import type { AllyId, EquippedItem } from './types';
import { SCENES, type SceneId } from '../content/scenes';
import { STARTING_EQUIPMENT } from '../content/equipment';
import { BRIDGE_ENCOUNTER } from '../content/bridge';
import { createBattle } from './combat';
import { attachSupport, useSupport } from './support';
import { equipOwned, SHOP_PRICES, GEAR_UPGRADE_COST, CARD_UPGRADE_COST, CARD_REMOVE_COST, MIN_DECK } from './workshop';

export interface SystemsState {
  owned: EquippedItem[];
  stock: string[];
  reached: SceneId[];
  effects: SceneId[];
  scene: { id: SceneId; beat: number; replay: boolean } | null;
  objective: string;
  allies: AllyId[];
  supportTaught: boolean;
}
export function betweenEncounters(state: CampaignState): boolean {
  return !!state.systems && !state.tutorial && !state.replay && !state.systems.scene && ['ready','complete','map','destination','route-complete'].includes(state.phase);
}
export function atWorkshop(state: CampaignState): boolean {
  return betweenEncounters(state) && state.phase === 'destination' && state.currentNode === 'route-workshop' && !state.completedNodes.includes('route-workshop');
}
export function openScene(state: CampaignState, id: SceneId, replay = false): CampaignState {
  const systems = state.systems!;
  return { ...state, systems: { ...systems, scene: { id, beat: 0, replay }, reached: replay || systems.reached.includes(id) ? systems.reached : [...systems.reached, id] } };
}
function finishScene(state: CampaignState): CampaignState {
  const systems = state.systems!, scene = systems.scene!;
  if (scene.replay) return { ...state, systems: { ...systems, scene: null }, revision: state.revision + 1 };
  let next: CampaignState = { ...state, revision: state.revision + 1, systems: { ...systems, scene: null,
    effects: systems.effects.includes(scene.id) ? systems.effects : [...systems.effects, scene.id], objective: SCENES[scene.id].objective } };
  if (scene.id === 'home') next = openScene(next, 'regulator');
  if (scene.id === 'regulator') next = openScene(next, 'ashways');
  return next;
}
// null means the command belongs to the pre-existing campaign transition.
export function systemsTransition(state: CampaignState, command: CampaignCommand): CampaignState | null {
  if (command.type === 'enable-systems') {
    if (state.systems || !state.progression) return state;
    const owned = Object.values(state.profile.equipment ?? STARTING_EQUIPMENT).map(item => ({ ...item }));
    let next: CampaignState = { ...state, revision: state.revision + 1, systems: { owned, stock: Object.keys(SHOP_PRICES).filter(id => !owned.some(item => item.id === id)), reached: [], effects: [], scene: null, allies: [], supportTaught: false, objective: 'Find a passage through the kiln.' } };
    if (state.tutorial?.step === 0 && !state.guidedComplete) next = openScene(next, 'home');
    else if (state.phase === 'destination' && state.currentNode === 'route-teacher') next = openScene(next, 'oren');
    else if (state.phase === 'destination' && state.currentNode === 'route-story') next = openScene(next, 'crossing');
    return next;
  }
  const systems = state.systems;
  if (!systems) return null;
  if (systems.scene) {
    if (command.type === 'scene-skip') return finishScene(state);
    if (command.type !== 'scene-next') return state;
    if ((systems.scene.beat + 1) * 2 >= SCENES[systems.scene.id].lines.length) return finishScene(state);
    return { ...state, revision: state.revision + 1, systems: { ...systems, scene: { ...systems.scene, beat: systems.scene.beat + 1 } } };
  }
  if (command.type === 'replay-scene') {
    if (!betweenEncounters(state) || !systems.reached.includes(command.sceneId)) return state;
    return openScene({ ...state, revision: state.revision + 1 }, command.sceneId, true);
  }
  if (command.type === 'scene-next' || command.type === 'scene-skip') return state;
  if (command.type === 'start-bridge') {
    if (!betweenEncounters(state) || state.phase !== 'destination' || state.currentNode !== 'route-story' || !systems.effects.includes('crossing') || state.completedNodes.includes('route-story')) return state;
    const allies: AllyId[] = systems.allies.includes('iven') ? systems.allies : [...systems.allies, 'iven'];
    const battle = attachSupport(createBattle(state.profile, BRIDGE_ENCOUNTER, state.rng), allies, systems.supportTaught ? null : 'iven');
    return { ...state, phase: 'battle', revision: state.revision + 1, battle, battleStart: structuredClone(battle), systems: { ...systems, allies }, progression: { ...state.progression!, battleNode: 'route-story' } };
  }
  if (command.type === 'support') {
    if (state.phase !== 'battle' || state.tutorial || state.replay || !state.battle || !systems.allies.includes(command.ally)) return state;
    const battle = useSupport(state.battle, command.ally, command.battleRevision);
    return battle === state.battle ? state : { ...state, battle, revision: state.revision + 1, systems: { ...systems, supportTaught: true } };
  }
  if (command.type === 'equip') {
    const item = systems.owned.find(item => item.id === command.itemId);
    if (!betweenEncounters(state) || !item) return state;
    const profile = equipOwned(state.profile, item);
    if (JSON.stringify(profile.equipment) === JSON.stringify(state.profile.equipment)) return state;
    return { ...state, profile, revision: state.revision + 1 };
  }
  if (command.type === 'buy' || command.type === 'upgrade-item') {
    if (!atWorkshop(state)) return state;
    const buying = command.type === 'buy', item = systems.owned.find(item => item.id === command.itemId);
    const cost = buying ? SHOP_PRICES[command.itemId] : GEAR_UPGRADE_COST;
    if (!Object.hasOwn(SHOP_PRICES, command.itemId) || state.salvage < cost || (buying ? !!item || !systems.stock.includes(command.itemId) : !item || !!item.upgraded)) return state;
    const owned = buying ? [...systems.owned, { id: command.itemId }] : systems.owned.map(owned => owned.id === command.itemId ? { ...owned, upgraded: true } : owned);
    let profile = state.profile;
    if (!buying && Object.values(profile.equipment ?? STARTING_EQUIPMENT).some(equipped => equipped.id === command.itemId)) profile = equipOwned(profile, owned.find(owned => owned.id === command.itemId)!);
    return { ...state, profile, salvage: state.salvage - cost, revision: state.revision + 1, systems: { ...systems, owned, stock: buying ? systems.stock.filter(id => id !== command.itemId) : systems.stock } };
  }
  if (command.type === 'refine-card' || command.type === 'remove-card') {
    const card = state.profile.deck.find(card => card.id === command.cardId), removing = command.type === 'remove-card', cost = removing ? CARD_REMOVE_COST : CARD_UPGRADE_COST;
    if (!atWorkshop(state) || !card || card.type === 'pulse' || state.salvage < cost || (removing ? state.profile.deck.length <= MIN_DECK : !!card.upgrade)) return state;
    const deck = removing ? state.profile.deck.filter(card => card.id !== command.cardId) : state.profile.deck.map(card => card.id === command.cardId ? { ...card, upgrade: 'refined' as const } : card);
    return { ...state, profile: { ...state.profile, deck }, salvage: state.salvage - cost, revision: state.revision + 1 };
  }
  if (command.type === 'continue-route' && state.currentNode === 'route-story' && !state.completedNodes.includes('route-story')) return state;
  return null;
}
export function systemsEvents(previous: CampaignState, next: CampaignState, command: CampaignCommand): CampaignState {
  if (next === previous || !next.systems) return next;
  if (command.type === 'choose-node') {
    if (command.nodeId === 'route-teacher') return openScene(next, 'oren');
    if (command.nodeId === 'route-story') return openScene(next, 'crossing');
  }
  if (command.type === 'choose-reward') {
    if (previous.pendingReward?.nodeId === 'route-teacher') return openScene(next, 'hope');
    if (previous.pendingReward?.nodeId === 'route-story') return openScene(next, 'partnership');
  }
  if ((command.type === 'start-encounter' || command.type === 'enter') && next.battle) {
    const battle = attachSupport(next.battle, next.systems.allies);
    return { ...next, battle, battleStart: structuredClone(battle) };
  }
  return next;
}
