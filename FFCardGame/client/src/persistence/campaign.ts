import { CAMPAIGN_ENCOUNTER, CAMPAIGN_PROFILE, CHECKPOINT_CLAIM, CHECKPOINT_NODE } from '../content/campaign';
import { createBattle } from '../game/combat';
import { deriveStats } from '../game/equipment';
import { replayProgression, type CampaignState, type CampaignCommand } from '../game/campaign';
import type { BattleState, CharacterProfile } from '../game/types';
import { LESSON_CLAIM, LESSON_NODE, LESSON_STEPS } from '../content/tutorial';
import { tutorialMatches, type TutorialState } from '../game/tutorial';
import { ROUTE_PREVIEW } from '../content/dungeon';
import { dungeonPath, validDungeonPath } from '../game/dungeon';

export const SAVE_KEY = 'kiln-courier.story-save';
export const SAVE_VERSION = 6;
export const CONTENT_VERSION = 'systems-preview-6';
export const MAX_SAVE_BYTES = 512 * 1024;
export interface SaveEnvelope { version: 6; contentVersion: typeof CONTENT_VERSION; savedAt: string; state: CampaignState }
export type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'> | undefined;
export type SaveRead = { kind: 'empty' | 'unavailable' } | { kind: 'valid'; save: SaveEnvelope } | { kind: 'invalid'; raw: string; reason: string };

function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function integer(value: unknown, maximum: number, minimum = 0): asserts value is number {
  requireValue(Number.isSafeInteger(value) && (value as number) >= minimum && (value as number) <= maximum, 'Invalid resource or counter.');
}
function record(value: unknown): asserts value is Record<string, unknown> {
  requireValue(!!value && typeof value === 'object' && !Array.isArray(value), 'Expected a save object.');
}
function keys(value: object, expected: readonly string[]) {
  requireValue(JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()), 'Unexpected or missing save fields.');
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function equal(a: unknown, b: unknown) { return canonical(a) === canonical(b); }
function validateProfile(value: unknown): asserts value is CharacterProfile {
  record(value);
  keys(value, ['id', 'name', 'maxHp', 'hp', 'maxMp', 'mp', 'deck', 'equipment']);
  requireValue(value.id === CAMPAIGN_PROFILE.id && value.name === CAMPAIGN_PROFILE.name && value.maxHp === 60 && value.maxMp === 10, 'Unknown character profile.');
  requireValue(equal(value.deck, CAMPAIGN_PROFILE.deck), 'Unknown or invalid deck.');
  record(value.equipment);
  keys(value.equipment, ['gauntlet', 'armor', 'utility']);
  for (const item of Object.values(value.equipment)) {
    record(item);
    requireValue(Object.keys(item).every(key => key === 'id' || key === 'upgraded'), 'Unknown equipment fields.');
    requireValue(typeof item.id === 'string', 'Unknown equipment.');
  }
  // deriveStats checks known item IDs, slots, upgrades and penalties.
  const stats = deriveStats(value as unknown as CharacterProfile);
  integer(value.hp, 60, 1);
  integer(value.mp, stats.maxMp);
}
function validateBattle(value: unknown, start: BattleState): asserts value is BattleState {
  record(value);
  keys(value, Object.keys(start));
  requireValue(equal(value.config, start.config), 'Battle configuration does not match its checkpoint.');
  record(value.hero); record(value.enemy);
  keys(value.hero, ['hp', 'block']); keys(value.enemy, ['hp', 'block']);
  integer(value.hero.hp, start.config.hero.maxHp);
  integer(value.hero.block, 100000);
  integer(value.enemy.hp, start.config.encounter.enemy.maxHp);
  integer(value.enemy.block, Math.max(...start.config.encounter.enemy.intents.map(i => i.block)));
  integer(value.energy, start.config.encounter.energyPerTurn);
  integer(value.mp, start.config.hero.maxMp);
  integer(value.strain, 9);
  integer(value.turn, 10000, 1); integer(value.revision, 100000);
  integer(value.rng, 0xffffffff);
  requireValue(value.intent === (value.turn - 1) % start.config.encounter.enemy.intents.length, 'Invalid enemy rotation.');
  const expectedOutcome = value.hero.hp === 0 ? 'defeat' : value.enemy.hp === 0 ? 'victory' : null;
  requireValue(value.outcome === expectedOutcome, 'Invalid battle outcome.');
  requireValue(Array.isArray(value.log) && value.log.length >= 1 && value.log.length <= 30 && value.log.every(line => typeof line === 'string' && line.length <= 500), 'Invalid battle log.');
  requireValue(Array.isArray(value.hand) && Array.isArray(value.draw) && Array.isArray(value.discard), 'Invalid deck piles.');
  const all = [...value.hand, ...value.draw, ...value.discard];
  const originals = [...start.hand, ...start.draw];
  requireValue(all.length === originals.length && new Set(all.map(c => c?.id)).size === originals.length && all.every(card => originals.some(original => equal(original, card))), 'Cards are missing, duplicated or changed.');
  requireValue(value.turn <= value.revision + 1, 'Invalid battle counters.');
}

function validateCheckpoint(value: unknown, guided = false) {
  record(value);
  keys(value, ['mode', 'chapter', 'phase', 'revision', 'rng', 'profile', 'currentNode', 'completedNodes', 'routeDecisions', 'claimedRewards', 'pendingReward', 'battle', 'battleStart']);
  requireValue(value.mode === 'story' && value.chapter === 'systems-preview', 'Unknown campaign content.');
  requireValue(['ready', 'battle', 'reward', 'complete'].includes(value.phase as string), 'Unknown campaign phase.');
  integer(value.revision, 1000000); integer(value.rng, 0xffffffff);
  validateProfile(value.profile);
  const started = value.phase !== 'ready';
  const resolved = value.phase === 'reward' || value.phase === 'complete';
  requireValue(equal(value.routeDecisions, [...(guided ? [LESSON_NODE] : []), ...(started ? [CHECKPOINT_NODE] : [])]) && value.currentNode === (started ? CHECKPOINT_NODE : null), 'Invalid route.');
  requireValue(equal(value.completedNodes, [...(guided ? [LESSON_NODE] : []), ...(resolved ? [CHECKPOINT_NODE] : [])]), 'Invalid completed nodes.');
  requireValue(equal(value.claimedRewards, [...(guided ? [LESSON_CLAIM] : []), ...(value.phase === 'complete' ? [CHECKPOINT_CLAIM] : [])]), 'Invalid claim history.');
  requireValue(equal(value.pendingReward, value.phase === 'reward' ? { id: CHECKPOINT_CLAIM, nodeId: CHECKPOINT_NODE, kind: 'checkpoint' } : null), 'Invalid pending reward.');
  if (!started) {
    requireValue(value.battle === null && value.battleStart === null && (guided || value.revision === 0) && equal(value.profile, CAMPAIGN_PROFILE), 'Invalid starting state.');
    return;
  }
  record(value.battleStart); record(value.battleStart.hero);
  const startProfile = { ...value.profile, hp: value.battleStart.hero.hp, mp: value.battleStart.mp };
  validateProfile(startProfile);
  const expectedStart = createBattle(startProfile, CAMPAIGN_ENCOUNTER, value.rng);
  requireValue(equal(value.battleStart, expectedStart), 'The original battle snapshot is invalid.');
  validateBattle(value.battle, expectedStart);
  requireValue(value.revision >= value.battle.revision + (resolved ? 2 : 1), 'Invalid campaign revision.');
  if (resolved) {
    requireValue(value.battle.outcome === 'victory' && value.profile.hp === value.battle.hero.hp && value.profile.mp === value.battle.mp, 'Invalid committed result.');
  } else requireValue(value.profile.hp === expectedStart.hero.hp && value.profile.mp === expectedStart.mp, 'Battle changed the pre-battle profile.');
}

function validateLesson(value: unknown): asserts value is TutorialState {
  record(value);
  keys(value, ['step', 'revision', 'battle', 'battleStart']);
  integer(value.step, LESSON_STEPS.length - 1);
  integer(value.revision, 1000000);
  requireValue(tutorialMatches(value as unknown as TutorialState), 'Lesson step and battle do not match. Keep this backup and restart the lesson from a valid save.');
}
function validateCampaignV2(value: unknown) {
  record(value);
  const { tutorial, replay, guidedComplete, salvage, ...checkpoint } = value;
  keys(value, [...Object.keys(checkpoint), 'tutorial', 'replay', 'guidedComplete', 'salvage']);
  requireValue(typeof guidedComplete === 'boolean' && salvage === (guidedComplete ? 12 : 0), 'Invalid lesson reward.');
  if (replay !== null) {
    requireValue(guidedComplete && tutorial === null, 'Lesson replay is not unlocked.');
    validateLesson(replay);
    integer(value.revision, 1000000);
    requireValue(value.revision >= replay.revision, 'Invalid replay revision.');
  }
  if (value.phase === 'tutorial') {
    validateLesson(tutorial);
    integer(value.revision, 1000000); integer(value.rng, 0xffffffff);
    requireValue(value.mode === 'story' && value.chapter === 'systems-preview' && !guidedComplete && replay === null
      && value.revision >= tutorial.revision && equal(value.profile, CAMPAIGN_PROFILE)
      && value.currentNode === null && equal(value.completedNodes, []) && equal(value.routeDecisions, []) && equal(value.claimedRewards, [])
      && value.pendingReward === null && value.battle === null && value.battleStart === null, 'Invalid guided campaign.');
    keys(checkpoint, ['mode', 'chapter', 'phase', 'revision', 'rng', 'profile', 'currentNode', 'completedNodes', 'routeDecisions', 'claimedRewards', 'pendingReward', 'battle', 'battleStart']);
  } else {
    requireValue(tutorial === null, 'Unexpected active lesson.');
    validateCheckpoint(checkpoint, guidedComplete);
  }
}

function validateCampaignV3(value: unknown) {
  record(value);
  requireValue(Object.hasOwn(value,'dungeon'), 'Missing dungeon progress.');
  const { dungeon, ...base } = value;
  if (dungeon === null) {
    requireValue(!['map','destination','route-complete'].includes(base.phase as string), 'Missing route.');
    validateCampaignV2(base);
    return;
  }
  record(dungeon); keys(dungeon,['id','origin']);
  requireValue(dungeon.id === ROUTE_PREVIEW.id && (dungeon.origin === 'ready' || dungeon.origin === 'complete'), 'Unknown dungeon.');
  requireValue(Array.isArray(base.routeDecisions) && base.routeDecisions.every(id => typeof id === 'string') && Array.isArray(base.completedNodes), 'Invalid route history.');
  const path = dungeonPath(ROUTE_PREVIEW,base.routeDecisions);
  requireValue(validDungeonPath(ROUTE_PREVIEW,path), 'The selected route is not connected.');
  const mapIds = new Set(ROUTE_PREVIEW.nodes.map(node => node.id));
  const active = ['map','destination','route-complete'].includes(base.phase as string);
  const completed = base.completedNodes.filter(id => mapIds.has(id as string));
  requireValue(equal(completed,base.phase === 'destination' ? path.slice(0,-1) : path), 'Invalid destination completion.');
  requireValue(base.phase !== 'tutorial', 'The route cannot bypass training.');
  if (base.phase === 'destination') requireValue(path.length > 1, 'The entry is already complete.');
  if (base.phase === 'map') requireValue(path.at(-1) !== ROUTE_PREVIEW.exit, 'The route has already ended.');
  else if (base.phase !== 'destination') requireValue(path.at(-1) === ROUTE_PREVIEW.exit, 'The route is not complete.');
  if (active) requireValue(base.currentNode === path.at(-1), 'Invalid current route node.');
  integer(base.revision,1000000);
  requireValue(base.revision >= path.length, 'Invalid route revision.');
  const originalPhase = active ? dungeon.origin : base.phase;
  requireValue(dungeon.origin !== 'complete' || originalPhase === 'complete', 'A completed checkpoint cannot be reset.');
  validateCampaignV2({ ...base, phase: originalPhase,
    revision: originalPhase === 'ready' && !base.guidedComplete ? 0 : base.revision,
    currentNode: active ? (dungeon.origin === 'complete' ? CHECKPOINT_NODE : null) : base.currentNode,
    routeDecisions: base.routeDecisions.filter(id => !mapIds.has(id)),
    completedNodes: base.completedNodes.filter(id => !mapIds.has(id as string)),
  });
}

function validateCommand(value:unknown):asserts value is CampaignCommand {
  record(value);integer(value.revision,1000000);
  const fields:Record<string,string[]>={enter:['nodeId'],play:['cardId','battleRevision'],'end-turn':['battleRevision'],retry:[],resolve:[],claim:['claimId'],lesson:['command'],'start-replay':[],'reset-lesson':[],'open-map':[],'choose-node':['nodeId'],'continue-route':['nodeId'],'leave-map':[],'start-encounter':['nodeId'],rest:['nodeId'],discover:['nodeId','option'],'choose-reward':['claimId','card'],'start-opening':[],'enable-systems':[],buy:['itemId'],'upgrade-item':['itemId'],equip:['itemId'],'refine-card':['cardId'],'remove-card':['cardId'],'scene-next':[],'scene-skip':[],'replay-scene':['sceneId'],'start-bridge':[],support:['ally','battleRevision']};
  requireValue(typeof value.type==='string'&&Object.hasOwn(fields,value.type),'Unknown saved action.');
  keys(value,['type','revision',...fields[value.type]]);
  for(const field of ['nodeId','cardId','claimId','itemId','sceneId'])if(Object.hasOwn(value,field))requireValue(typeof value[field]==='string','Invalid action reference.');
  if(Object.hasOwn(value,'battleRevision'))integer(value.battleRevision,100000);
  if(value.type==='support')requireValue(value.ally==='iven','Unknown ally.');
  if(value.type==='discover')requireValue(['salvage','cards','mp','kit'].includes(value.option as string),'Invalid discovery.');
  if(value.type==='choose-reward')requireValue(value.card===null||typeof value.card==='string','Invalid reward choice.');
  if(value.type==='lesson'){
    record(value.command);keys(value.command,['step','revision','action']);integer(value.command.step,18);integer(value.command.revision,1000000);
    requireValue(equal(value.command.action,LESSON_STEPS[value.command.step].action),'Invalid lesson action.');
  }
}
export function validateCampaign(value:unknown):asserts value is CampaignState {
  record(value);requireValue(Object.hasOwn(value,'progression'),'Missing progression.');
  requireValue(Object.hasOwn(value,'systems'),'Missing systems progress.');
  const {progression,systems,...legacy}=value;
  if(progression===null){requireValue(systems===null,'Missing progression history.');validateCampaignV3(legacy);return;}
  record(progression);keys(progression,['baseline','commands','battleNode']);
  validateCampaignV3(progression.baseline);
  requireValue(Array.isArray(progression.commands)&&progression.commands.length<=10000,'Invalid progression history.');
  for(const command of progression.commands)validateCommand(command);
  const expected=replayProgression(progression.baseline as Omit<CampaignState,'progression'|'systems'>,progression.commands);
  requireValue(equal(value,expected),'Progress, rewards and saved actions do not match.');
}

// Migrate the original checkpoint format without changing its battle or claims.
// Old hint dismissal never counts as guided combat completion.
export function decodeSave(raw: string): SaveEnvelope {
  requireValue(new TextEncoder().encode(raw).byteLength <= MAX_SAVE_BYTES, 'Save file is too large (maximum 512 KB).');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON.'); }
  record(value);
  keys(value, ['version', 'contentVersion', 'savedAt', 'state']);
  requireValue(typeof value.savedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value.savedAt) && Number.isFinite(Date.parse(value.savedAt)), 'Invalid save date.');
  if (value.version === 1) {
    requireValue(value.contentVersion === 'systems-preview-1', 'This save belongs to unsupported game content.');
    validateCheckpoint(value.state);
    record(value.state);
    value = { ...value, version: 2, contentVersion: 'systems-preview-2', state: { ...value.state, tutorial: null, replay: null, guidedComplete: false, salvage: 0 } };
    record(value);
  }
  if (value.version === 2) {
    requireValue(value.contentVersion === 'systems-preview-2', 'This save belongs to unsupported game content.');
    validateCampaignV2(value.state);
    record(value.state);
    value = { ...value, version: 3, contentVersion: 'systems-preview-3', state: { ...value.state, dungeon: null } };
    record(value);
  }
  if(value.version===3){
    requireValue(value.contentVersion==='systems-preview-3','This save belongs to unsupported game content.');
    validateCampaignV3(value.state);record(value.state);
    value={...value,version:4,contentVersion:'systems-preview-4',state:{...value.state,progression:null}};record(value);
  }
  if(value.version===4){
    requireValue(value.contentVersion==='systems-preview-4','This save belongs to unsupported game content.');
    record(value.state);value={...value,version:5,contentVersion:'systems-preview-5',state:{...value.state,systems:null}};record(value);
  }
  if(value.version===5){requireValue(value.contentVersion==='systems-preview-5','Unsupported game content.');value={...value,version:SAVE_VERSION,contentVersion:CONTENT_VERSION};record(value);}
  requireValue(value.version === SAVE_VERSION, 'This save version is unsupported. Your existing progress is unchanged.');
  requireValue(value.contentVersion === CONTENT_VERSION, 'This save belongs to unsupported game content.');
  validateCampaign(value.state);
  return value as unknown as SaveEnvelope;
}
export function encodeSave(state: CampaignState, savedAt = new Date().toISOString()): string {
  const raw = JSON.stringify({ version: SAVE_VERSION, contentVersion: CONTENT_VERSION, savedAt, state });
  decodeSave(raw);
  return raw;
}
export function readSave(storage: StorageAccess = () => globalThis.localStorage): SaveRead {
  let raw: string | null;
  try {
    const target = storage();
    if (!target) return { kind: 'unavailable' };
    raw = target.getItem(SAVE_KEY);
  } catch { return { kind: 'unavailable' }; }
  if (raw === null) return { kind: 'empty' };
  try { return { kind: 'valid', save: decodeSave(raw) }; }
  catch (error) { return { kind: 'invalid', raw, reason: error instanceof Error ? error.message : 'Invalid save.' }; }
}
export function writeSave(state: CampaignState, storage: StorageAccess = () => globalThis.localStorage): { ok: boolean; savedAt: string } {
  const savedAt = new Date().toISOString();
  try {
    const raw = encodeSave(state, savedAt);
    const target = storage();
    if (!target) return { ok: false, savedAt };
    target.setItem(SAVE_KEY, raw);
    return { ok: true, savedAt };
  } catch { return { ok: false, savedAt }; }
}
