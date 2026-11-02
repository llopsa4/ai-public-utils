import { ROOMS } from './rooms';
import { SECRET_FLAGS } from '../engine/state';
import type { ActorId, Command, GameState, NpcId, Point, Verb } from '../engine/types';

/** Verbs offered for the characters (hotspot verbs live in rooms.ts). */
export const ACTOR_VERBS: Record<ActorId, Verb[]> = {
  hero: ['look', 'talk', 'crouch', 'lie', 'stand'],
  oren: ['look', 'talk', 'crouch', 'lie', 'stand'],
  nell: ['look', 'talk', 'crouch', 'lie', 'stand'],
};

/** Where Mara stands to talk to each character. */
const TALK_SPOTS: Record<NpcId, { at: Point; face: 'left' | 'right'; npcFace: 'left' | 'right' }> = {
  oren: { at: { x: 470, y: 304 }, face: 'right', npcFace: 'left' },
  nell: { at: { x: 346, y: 298 }, face: 'left', npcFace: 'right' },
};

/** Inventory items offer these verbs in the action ring. */
export const ITEM_VERBS: Verb[] = ['look', 'use'];

/** Off-screen voice position for Oren calling down the stairs. */
const STAIRS_VOICE = { x: 560, y: 120 };

const say = (text: string, actor: ActorId = 'hero', at?: Point): Command => (at ? { type: 'say', actor, text, at } : { type: 'say', actor, text });
const flag = (name: string, value = true): Command => ({ type: 'setFlag', flag: name, value });
const pose = (actor: ActorId, p: 'stand' | 'crouch' | 'dead'): Command => ({ type: 'pose', actor, pose: p });
const wait = (ms: number): Command => ({ type: 'wait', ms });
const go = (room: string, entry: string): Command => ({ type: 'room', room, entry });

function approach(state: GameState, target: string): Command[] {
  const spot = ROOMS[state.room].hotspots.find(h => h.id === target);
  return spot?.walkTo ? [{ type: 'walk', to: spot.walkTo, face: spot.face }] : [];
}

function toNpc(id: NpcId): Command[] {
  const s = TALK_SPOTS[id];
  return [{ type: 'walk', to: s.at, face: s.face }, { type: 'face', actor: id, face: s.npcFace }];
}

/** Look lines with a second and third variant (`<key>.2`, `<key>.3`); repeated looks cycle through them. */
const VARIED_LOOKS = [
  'line.rackLook', 'line.notebookOnBench', 'line.jarLook', 'line.workbenchLook', 'line.stoolLook', 'line.drumLook', 'line.tentFlapLook',
  'line.toTentLook', 'line.nicheLook', 'line.pulleysLook', 'line.jarsLook', 'line.cartLook', 'line.roomCurtainLook',
  'line.latchLook', 'line.soupLook', 'line.shoesLook', 'line.hearthLook', 'line.stairsLook', 'line.gateLook', 'line.toRoomLook',
  'line.regulatorLook', 'line.gaugeLook', 'line.logbookLook', 'line.lanternLook', 'line.galleryStairsLook',
  'line.valveLook', 'line.passageLook', 'line.pipesLook', 'line.wayBackLook',
  'line.heroLook', 'line.orenLook', 'line.nellLook',
];
const VARIANT_KEYS = VARIED_LOOKS.flatMap(k => [`${k}.2`, `${k}.3`]);

/** Items with their own reply when used on something that doesn't take them. */
const ITEM_FAILS = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'];

/** Secrets: looking at them for the first time marks them found. */
const SECRETS: Record<string, { flag: (typeof SECRET_FLAGS)[number]; line: string; again: string }> = {
  tally: { flag: 'secretTally', line: 'line.secretTally', again: 'line.secretTallyAgain' },
  chalk: { flag: 'secretChalk', line: 'line.secretChalk', again: 'line.secretChalkAgain' },
  sign: { flag: 'secretSign', line: 'line.secretSign', again: 'line.secretSignAgain' },
  railNames: { flag: 'secretRail', line: 'line.secretRail', again: 'line.secretRailAgain' },
};

function fallback(verb: Verb, item?: string): Command[] {
  if (item) return [say(ITEM_FAILS.includes(item) ? `line.useFails.${item}` : 'line.useFails')];
  if (verb === 'look') return [say('line.nothingSpecial')];
  return [say('line.cannot')];
}

/**
 * Resolves what happens when the player applies a verb (or an inventory item) to a target.
 * Pure: it reads the state and returns commands; the scene plays them and applies their effects.
 * Targets are hotspot ids, character ids, or `item:<id>` for things in the inventory.
 */
export function interact(state: GameState, verb: Verb, target: string, item?: string): Command[] {
  const commands = resolve(state, verb, target, item);
  return verb === 'look' && !item ? cycleLook(state, target, commands) : commands;
}

/** Swaps a varied look line for the next variant and counts the look. */
function cycleLook(state: GameState, target: string, commands: Command[]): Command[] {
  const i = commands.findIndex(c => c.type === 'say' && VARIED_LOOKS.includes(c.text));
  if (i < 0) return commands;
  const line = commands[i] as Extract<Command, { type: 'say' }>;
  const n = (state.looks[target] ?? 0) % 3;
  const text = n === 0 ? line.text : `${line.text}.${n + 1}`;
  return [...commands.slice(0, i), { ...line, text }, ...commands.slice(i + 1), { type: 'looked', id: target }];
}

function resolve(state: GameState, verb: Verb, target: string, item?: string): Command[] {
  const f = state.flags;
  const secret = SECRETS[target];
  if (secret) {
    if (item || verb !== 'look') return fallback(verb, item);
    if (f[secret.flag]) return [say(secret.again)];
    return [...approach(state, target), say(secret.line), flag(secret.flag)];
  }
  const has = (i: string) => state.inventory.includes(i);

  switch (target) {
    // ---------------------------------------------------------- inventory ---
    case 'item:gauntlet': return [say(verb === 'look' ? 'line.gauntletLook' : 'line.cannot')];
    case 'item:notebook': return [say(verb === 'look' ? (f.procedureKnown ? 'line.notebookLookAfter' : 'line.notebookLook') : 'line.cannot')];
    case 'item:regulator': return [say(verb === 'look' ? 'line.regulatorItemLook' : 'line.cannot')];
    case 'item:bread': return [say(verb === 'look' ? 'line.breadLook' : 'line.cannot')];
    case 'item:scarf': return [say(verb === 'look' ? 'line.scarfLook' : 'line.cannot')];

    // ---------------------------------------------------------------- Mara ---
    case 'hero':
      if (item === 'bread') return [say('line.breadEat')];
      if (item === 'scarf') return [say('line.scarfWear')];
      if (item) return [say('line.heroUseItem')];
      switch (verb) {
        case 'look': return [say(f.kilnCold ? 'line.heroLookCold' : 'line.heroLook')];
        case 'talk': return [say('line.heroTalk')];
        case 'crouch': return [pose('hero', 'crouch')];
        case 'lie': return [pose('hero', 'dead'), wait(400), say('line.heroLie')];
        case 'stand': return state.hero.pose === 'stand' ? [say('line.heroAlreadyStanding')] : [pose('hero', 'stand')];
      }
      break;

    // --------------------------------------------------------- Mara's room ---
    case 'rack':
      if (item) break;
      switch (verb) {
        case 'look': return [say(f.hasGauntlet ? 'line.rackLookEmpty' : 'line.rackLook')];
        case 'take':
        case 'use':
          if (f.hasGauntlet) return [say('line.rackEmpty')];
          return [...approach(state, target), wait(150), flag('hasGauntlet'), { type: 'addItem', item: 'gauntlet' }, wait(250), say('line.rackTake')];
      }
      break;

    case 'notebook':
      if (item) break;
      switch (verb) {
        case 'look': return [say('line.notebookOnBench')];
        case 'open': return [...approach(state, target), say('line.notebookOpen')];
        case 'take': return [...approach(state, target), flag('hasNotebook'), { type: 'addItem', item: 'notebook' }, say('line.notebookTake')];
      }
      break;

    case 'tentFlap':
      if (item) break;
      if (verb === 'look') return [say('line.tentFlapLook')];
      if (verb === 'go' || verb === 'open') {
        if (!f.hasGauntlet) return [...approach(state, target), say('line.tentNotYet')];
        return [...approach(state, target), go('maraRoom', 'fromTent')];
      }
      break;

    case 'workbench':
      if (item) break;
      if (verb === 'look') return [say('line.workbenchLook')];
      if (verb === 'use') return [...approach(state, target), say('line.workbenchUse')];
      break;

    case 'jar':
      if (item) break;
      if (verb === 'look') return [say('line.jarLook')];
      if (verb === 'take') return [say('line.jarTake')];
      break;

    case 'stool':
      if (item) break;
      if (verb === 'look') return [say('line.stoolLook')];
      if (verb === 'use') return [say('line.stoolUse')];
      break;

    case 'drum':
      if (item) break;
      if (verb === 'look') return [say('line.drumLook')];
      if (verb === 'use') return [...approach(state, target), say('line.drumUse')];
      break;

    case 'toTent':
      if (item) break;
      if (verb === 'look') return [say('line.toTentLook')];
      if (verb === 'go') return [...approach(state, target), go('tent', 'fromKilnHall')];
      break;

    case 'niche': // the kiln mouths
      if (item) break;
      if (verb === 'look') return [say(f.kilnCold ? 'line.nicheLookCold' : 'line.nicheLook')];
      if (verb === 'use') return [say(f.kilnCold ? 'line.nicheUseCold' : 'line.nicheUse')];
      break;

    case 'pulleys':
      if (item) break;
      if (verb === 'look') return [say('line.pulleysLook')];
      if (verb === 'use') return [...approach(state, target), say('line.pulleysUse')];
      break;

    case 'jars':
      if (item) break;
      if (verb === 'look') return [say('line.jarsLook')];
      if (verb === 'take') return [say('line.jarsTake')];
      break;

    case 'cart':
      if (item) break;
      if (verb === 'look') return [say('line.cartLook')];
      if (verb === 'use') return [say('line.cartUse')];
      break;

    case 'roomCurtain':
      if (item) break;
      if (verb === 'look') return [say('line.roomCurtainLook')];
      if (verb === 'go') return [...approach(state, target), go('firingHouse', 'fromMaraRoom')];
      break;

    // -------------------------------------------------------- firing house ---
    case 'pantryDoor':
      if (item === 'gauntlet') {
        if (f.latchFixed) return [say('line.latchAlreadyFixed')];
        return [
          ...approach(state, target), pose('hero', 'crouch'), wait(350), flag('latchFixed'), wait(250), pose('hero', 'stand'),
          { type: 'face', actor: 'nell', face: 'right' },
          say('line.nellFixed', 'nell'), say('line.maraLatch'), say('line.nellSoup', 'nell'), say('line.maraNightShift'),
          wait(400), { type: 'shake', ms: 700 }, say('line.kilnGroans'),
          say('line.orenCalls', 'oren', STAIRS_VOICE), flag('alarm'), say('line.maraAlarm'),
        ];
      }
      if (item) break;
      switch (verb) {
        case 'look': return [say(f.latchFixed ? 'line.latchLookFixed' : 'line.latchLook')];
        case 'open':
        case 'use':
          if (f.latchFixed) return [say('line.latchOpenFixed')];
          return [...approach(state, target), say(f.hasGauntlet ? 'line.latchStuckHint' : 'line.latchStuck')];
      }
      break;

    case 'soup':
      if (item === 'bread') return [say('line.soupBread')];
      if (item) break;
      switch (verb) {
        case 'look': return [say(f.kilnCold ? 'line.soupLookCold' : 'line.soupLook')];
        case 'take': return [say('line.soupTake')];
        case 'use': return [say('line.soupUse')];
      }
      break;

    case 'shoes':
      if (item) break;
      if (verb === 'look') return [say(f.kilnCold ? 'line.shoesLookCold' : 'line.shoesLook')];
      if (verb === 'take') return [say('line.shoesTake')];
      break;

    case 'hearth':
      if (item) break;
      if (verb === 'look') return [say(f.kilnCold ? 'line.hearthLookCold' : 'line.hearthLook')];
      if (verb === 'use') return [say(f.kilnCold ? 'line.hearthUseCold' : 'line.hearthUse')];
      break;

    case 'stairs':
      if (item) break;
      if (verb === 'look') return [say(f.alarm ? 'line.stairsLookAlarm' : 'line.stairsLook')];
      if (verb === 'go') {
        if (!f.alarm) return [say('line.stairsNotYet')];
        return [...approach(state, target), go('gallery', 'fromFiringHouse')];
      }
      break;

    case 'kilnGate':
      if (item) break;
      switch (verb) {
        case 'look': return [say(has('regulator') ? 'line.gateLookReady' : 'line.gateLook')];
        case 'open':
        case 'go':
          if (!has('regulator')) return [...approach(state, target), say('line.gateNotYet')];
          return [...approach(state, target), say('line.gateLeave'), go('ashways', 'fromFiringHouse')];
      }
      break;

    case 'toRoom':
      if (item) break;
      if (verb === 'look') return [say('line.toRoomLook')];
      if (verb === 'go') return [...approach(state, target), go('maraRoom', 'fromFiringHouse')];
      break;

    // ---------------------------------------------------- regulator gallery ---
    case 'regulator':
      if (item === 'gauntlet') {
        if (f.kilnCold) return [say('line.regulatorGone')];
        if (!f.patchFailed) {
          return [...approach(state, target), pose('hero', 'crouch'), wait(500), { type: 'shake', ms: 300 }, pose('hero', 'stand'),
            say('line.maraPatch'), say('line.orenLockingRing', 'oren'), flag('patchFailed')];
        }
        if (!f.decided) return [say('line.notReady')];
        if (!f.procedureKnown) return [say('line.needProcedure')];
        return [
          ...approach(state, target), pose('hero', 'crouch'), wait(500), say('line.releaseOne'), wait(300),
          { type: 'shake', ms: 900 }, flag('kilnCold'), { type: 'addItem', item: 'regulator' }, wait(400), pose('hero', 'stand'),
          say('line.releaseDone'), say('line.orenShelter', 'oren'), say('line.maraPulse'),
        ];
      }
      if (item === 'notebook') {
        if (f.kilnCold) return [say('line.regulatorGone')];
        if (!f.patchFailed) return [say('line.notebookTooSoon')];
        if (!f.decided) return [say('line.notebookNotReady')];
        if (f.procedureKnown) return [say('line.procedureAlready')];
        return [...approach(state, target), say('line.notebookProcedure1'), say('line.notebookProcedure2'), flag('procedureKnown')];
      }
      if (item) break;
      switch (verb) {
        case 'look':
          if (f.kilnCold) return [say('line.regulatorLookCold')];
          return [say(f.patchFailed ? 'line.regulatorLookRing' : 'line.regulatorLook')];
        case 'use':
        case 'take':
        case 'open':
          if (f.kilnCold) return [say('line.regulatorGone')];
          return [say('line.regulatorBareHands')];
      }
      break;

    case 'gauge':
      if (item) break;
      if (verb === 'look') return [say(f.kilnCold ? 'line.gaugeLookCold' : 'line.gaugeLook')];
      if (verb === 'use') return [say('line.gaugeUse')];
      break;

    case 'logbook':
      if (item) break;
      if (verb === 'look') return [say('line.logbookLook')];
      if (verb === 'take') return [say('line.logbookTake')];
      break;

    case 'lantern':
      if (item) break;
      if (verb === 'look') return [say('line.lanternLook')];
      if (verb === 'take') return [say('line.lanternTake')];
      break;

    case 'galleryStairs':
      if (item) break;
      if (verb === 'look') return [say('line.galleryStairsLook')];
      if (verb === 'go') return [...approach(state, target), go('firingHouse', 'fromGallery')];
      break;

    // ------------------------------------------------------------- ashways ---
    case 'sweeper':
    case 'sweeperAtPipe':
      if (item === 'gauntlet') return [say('line.sweeperFight')];
      if (item === 'regulator') return [say('line.sweeperRegulator')];
      if (item) break;
      if (verb === 'look') {
        if (f.valveVented) return [say('line.sweeperLookPipe')];
        return [say('line.sweeperLook1'), flag('sawSweeper'), say('line.sweeperLook2')];
      }
      if (verb === 'talk') return [say('line.sweeperTalk')];
      if (verb === 'use') return [say('line.sweeperUse')];
      break;

    case 'valve':
      if (item === 'gauntlet') {
        if (f.valveVented) return [say('line.valveAlready')];
        return [...approach(state, target), wait(200), { type: 'shake', ms: 250 }, flag('valveVented'),
          { type: 'moveObject', id: 'sweeper', x: 172, y: 266, ms: 1600 }, say('line.valveVented')];
      }
      if (item) break;
      switch (verb) {
        case 'look': return [say(f.valveVented ? 'line.valveLookVented' : 'line.valveLook')];
        case 'open':
        case 'use': return [...approach(state, target), say(f.valveVented ? 'line.valveAlready' : 'line.valveStiff')];
        case 'close': return [say('line.valveClose')];
      }
      break;

    case 'passage':
      if (item) break;
      if (verb === 'look') return [say(f.valveVented ? 'line.passageLookClear' : 'line.passageLook')];
      if (verb === 'go') {
        if (!f.valveVented) return [say('line.passageBlocked')];
        return [...approach(state, target), say('line.farewell'), wait(300), { type: 'end' }];
      }
      break;

    case 'pipes':
      if (item) break;
      if (verb === 'look') return [say('line.pipesLook')];
      if (verb === 'use') return [say('line.pipesUse')];
      break;

    case 'wayBack':
      if (item) break;
      if (verb === 'look') return [say('line.wayBackLook')];
      if (verb === 'go') return [say('line.wayBackGo')];
      break;

    // -------------------------------------------------------------- people ---
    case 'oren':
    case 'nell':
      return npc(state, target, verb, item);
  }
  return fallback(verb, item);
}

function npc(state: GameState, id: NpcId, verb: Verb, item?: string): Command[] {
  const npcPose = state.npcs[id].pose;
  const getUp: Command[] = npcPose === 'stand' ? [] : [pose(id, 'stand')];
  if (item) return [...toNpc(id), ...getUp, say(`line.${id}Item`, id)];
  switch (verb) {
    case 'look': return [say(npcPose === 'dead' ? `line.${id}LookDown` : `line.${id}Look${state.flags.kilnCold ? 'Cold' : ''}`)];
    case 'talk': return [...toNpc(id), ...getUp, { type: 'dialogue', id }];
    case 'crouch': return [...toNpc(id), ...getUp, say(`line.askCrouch.${id}`), pose(id, 'crouch'), say(`line.${id}Crouch`, id)];
    case 'lie': return [...toNpc(id), ...getUp, say(`line.askLie.${id}`), say(`line.${id}Lie`, id), pose(id, 'dead')];
    case 'stand':
      if (npcPose === 'stand') return [say('line.alreadyStanding')];
      return [...toNpc(id), say('line.askStand'), pose(id, 'stand'), say(`line.${id}Stand`, id)];
  }
  return fallback(verb, item);
}

const NPC_KEYS = ['Item', 'Look', 'LookCold', 'LookDown', 'Crouch', 'Lie', 'Stand'];

/** Every string key that interactions can emit (used by the translation completeness test). */
export const INTERACTION_KEYS = [
  'line.useFails', 'line.nothingSpecial', 'line.cannot', 'line.alreadyStanding', 'line.askStand',
  'line.gauntletLook', 'line.notebookLook', 'line.notebookLookAfter', 'line.regulatorItemLook', 'line.breadLook', 'line.scarfLook',
  'line.breadEat', 'line.scarfWear', 'line.heroUseItem', 'line.heroLook', 'line.heroLookCold', 'line.heroTalk', 'line.heroLie', 'line.heroAlreadyStanding',
  'line.rackLook', 'line.rackLookEmpty', 'line.rackEmpty', 'line.rackTake',
  'line.notebookOnBench', 'line.notebookOpen', 'line.notebookTake',
  'line.nicheLook', 'line.nicheLookCold', 'line.nicheUse', 'line.nicheUseCold', 'line.roomCurtainLook',
  'line.tentFlapLook', 'line.tentNotYet', 'line.workbenchLook', 'line.workbenchUse', 'line.jarLook', 'line.jarTake',
  'line.stoolLook', 'line.stoolUse', 'line.drumLook', 'line.drumUse', 'line.toTentLook',
  'line.pulleysLook', 'line.pulleysUse', 'line.jarsLook', 'line.jarsTake', 'line.cartLook', 'line.cartUse',
  'line.latchAlreadyFixed', 'line.nellFixed', 'line.maraLatch', 'line.nellSoup', 'line.maraNightShift', 'line.kilnGroans', 'line.orenCalls', 'line.maraAlarm',
  'line.latchLook', 'line.latchLookFixed', 'line.latchOpenFixed', 'line.latchStuck', 'line.latchStuckHint',
  'line.soupBread', 'line.soupLook', 'line.soupLookCold', 'line.soupTake', 'line.soupUse',
  'line.shoesLook', 'line.shoesLookCold', 'line.shoesTake', 'line.hearthLook', 'line.hearthLookCold', 'line.hearthUse', 'line.hearthUseCold',
  'line.stairsLook', 'line.stairsLookAlarm', 'line.stairsNotYet', 'line.gateLook', 'line.gateLookReady', 'line.gateNotYet', 'line.gateLeave', 'line.toRoomLook',
  'line.regulatorGone', 'line.maraPatch', 'line.orenLockingRing', 'line.notReady', 'line.needProcedure', 'line.releaseOne', 'line.releaseDone',
  'line.orenShelter', 'line.maraPulse', 'line.notebookTooSoon', 'line.notebookNotReady', 'line.procedureAlready', 'line.notebookProcedure1', 'line.notebookProcedure2',
  'line.regulatorLook', 'line.regulatorLookRing', 'line.regulatorLookCold', 'line.regulatorBareHands',
  'line.gaugeLook', 'line.gaugeLookCold', 'line.gaugeUse', 'line.logbookLook', 'line.logbookTake', 'line.lanternLook', 'line.lanternTake', 'line.galleryStairsLook',
  'line.sweeperFight', 'line.sweeperRegulator', 'line.sweeperLookPipe', 'line.sweeperLook1', 'line.sweeperLook2', 'line.sweeperTalk', 'line.sweeperUse',
  'line.valveAlready', 'line.valveVented', 'line.valveLook', 'line.valveLookVented', 'line.valveStiff', 'line.valveClose',
  'line.passageLook', 'line.passageLookClear', 'line.passageBlocked', 'line.farewell', 'line.pipesLook', 'line.pipesUse', 'line.wayBackLook', 'line.wayBackGo',
  ...(['oren', 'nell'] as const).flatMap(id => [...NPC_KEYS.map(k => `line.${id}${k}`), `line.askCrouch.${id}`, `line.askLie.${id}`]),
  ...VARIANT_KEYS,
  ...ITEM_FAILS.map(i => `line.useFails.${i}`),
  ...Object.values(SECRETS).flatMap(s => [s.line, s.again]),
];
