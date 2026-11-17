import { CHAPTERS, loadChapter } from '../chapters';
import { equip } from '../engine/kit';
import { newGame } from '../engine/state';
import type { GameState } from '../engine/types';
import type { RoomScene } from '../game/scenes';
import type { Session } from '../game/session';

/** Reset only the regulator and its aftermath when replaying within Mara's chapter. */
export function prepareRegulatorDebugState(current: GameState): GameState {
  const state = current.chapter === 'ch1' ? structuredClone(current) : newGame('ch1');
  state.earlier = structuredClone(current.earlier);
  state.reached = [...new Set([...current.reached, 'ch1'])];
  state.room = 'gallery';
  state.hero = { x: 400, y: 282, face: 'up', pose: 'stand' };
  state.npcs.oren = { pose: 'stand', face: 'right' };
  for (const flag of ['boltLeft', 'boltRight', 'pressureBled', 'ringReleased', 'kilnCold',
    'fought', 'gearChecked', 'galleryQuiet', 'machineRefusalSeen', 'farewellReminded',
    'valveVented', 'sawSweeper', 'metMerchant', ...Object.keys(state.flags).filter(flag => flag.startsWith('ashways'))]) {
    delete state.flags[flag];
  }
  Object.assign(state.flags, { hasGauntlet: true, hasNotebook: true, dressed: true,
    hoistHelped: true, nellFed: true, latchFixed: true, alarm: true, metOren: true,
    patchFailed: true, decided: true, procedureKnown: true, gearUnlocked: true, protectionPrepared: true });
  state.inventory = [...new Set([...state.inventory.filter(item => item !== 'regulator'), 'gauntlet', 'notebook'])];
  if (!state.kit.owned.includes('layered-armor')) state.kit.owned.push('layered-armor');
  equip(state.kit, 'armor', 'layered-armor', true);
  return state;
}

const pending = new WeakSet<Session>();

/** Debug-only replay; wait for Phaser's new scene, then use the ordinary removal interaction. */
export async function openDebugRegulator(session: Session): Promise<boolean> {
  const blocked = () => session.ui.anyDialogOpen() || (!session.onTitle && (!session.scene || session.scene.isBusy()));
  if (pending.has(session) || blocked()) return false;
  pending.add(session);
  try {
    const original = session.state;
    await loadChapter('ch1', { art: true });
    if (session.state !== original || blocked()) return false;
    const scene = session.scene ?? session.title?.scene.get('room') as RoomScene | undefined;
    if (!scene) return false;
    const state = prepareRegulatorDebugState(original);
    return await new Promise<boolean>((resolve, reject) => {
      const finish = (result: boolean) => {
        clearTimeout(timeout);
        scene.events.off('create', ready);
        resolve(result);
      };
      const ready = () => {
        if (session.state !== state || session.scene !== scene || !scene.sys.isActive() || scene.isBusy()) {
          finish(false); return;
        }
        // runScript owns cancellation, removal, shutdown, rewards and the hatch encounter.
        void scene.runScript(CHAPTERS.ch1.interact(state, 'use', 'regulator', 'gauntlet'))
          .catch(() => session.ui.toast('Could not open the regulator puzzle.'));
        finish(true);
      };
      const timeout = setTimeout(() => finish(false), 15000);
      scene.events.once('create', ready);
      try { session.replaceState(state); }
      catch (error) {
        clearTimeout(timeout);
        scene.events.off('create', ready);
        reject(error);
      }
    });
  } finally {
    pending.delete(session);
  }
}
