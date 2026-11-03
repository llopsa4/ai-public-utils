// What each script command does in the room: one handler per command type (src/engine/types.ts
// Command). A handler returns false when the script must stop (a room or chapter change, the end).
// The table is checked to cover every command type.
import { t } from '../../engine/i18n';
import { settings } from '../../engine/settings';
import { sound } from '../../audio/sound';
import { applyCommand } from '../../engine/state';
import { TECHNIQUES } from '../../content/kit';
import type { Command } from '../../engine/types';
import { chapter, loadChapter, setChapter } from '../../chapters';
import type { RoomScene } from '../scenes';
import { runDialogue, say, wait } from './runner';
import { blowHatch, fight } from './fightBridge';
import { DOORWAY_STEP, FACE_VECTOR, FADE_MS } from './shared';

type Of<K extends Command['type']> = Extract<Command, { type: K }>;
type Handler<K extends Command['type']> = (scene: RoomScene, command: Of<K>) => Promise<boolean>;

/** setFlag, addItem, removeItem: story state the room shows at once (objects, satchel, toasts). */
const storyChange = async (scene: RoomScene, command: Of<'setFlag' | 'addItem' | 'removeItem'>): Promise<boolean> => {
  const state = scene.session.state;
  if (command.type === 'addItem') sound.pickup();
  const cue = command.type === 'setFlag' && command.value ? chapter().story.flagSounds[command.flag] : undefined;
  if (cue) sound[cue]();
  const newSecret = command.type === 'setFlag' && command.value && !state.flags[command.flag]
    && chapter().secretFlags.includes(command.flag);
  applyCommand(state, command);
  if (command.type === 'setFlag' && command.value && chapter().story.crowdReactsTo.includes(command.flag)) scene.crowd?.setMood(scene.crowdMood(), true);
  if (command.type === 'setFlag' && command.value && chapter().metFlags.includes(command.flag)) {
    const who = chapter().extras.find(e => e.met === command.flag);
    const found = chapter().metFlags.filter(f => state.flags[f]).length;
    if (who) scene.session.ui.toast(t('ui.metFound', { name: t(`speaker.${who.id}`), found: String(found), total: String(chapter().metFlags.length) }));
  }
  if (newSecret) {
    sound.choose();
    const found = chapter().secretFlags.filter(f => state.flags[f]).length;
    scene.session.ui.toast(t('ui.secretFound', { found: String(found), total: String(chapter().secretFlags.length) }));
  }
  scene.refreshObjects();
  scene.session.ui.renderInventory();
  return true;
};

export const COMMANDS: { [K in Command['type']]: Handler<K> } = {
  walk: async (scene: RoomScene, command: Of<'walk'>): Promise<boolean> => {
    if (scene.hero.pose !== 'stand') scene.hero.setPose('stand');
    scene.crowd?.heroHeading(command.to);
    await scene.hero.walk(scene.area.findPath(scene.hero.position, command.to));
    if (command.face) scene.hero.setFacing(command.face);
    scene.syncHero();
    return true;
  },
  face: async (scene: RoomScene, command: Of<'face'>): Promise<boolean> => {
    const state = scene.session.state;
    scene.actors.get(command.actor)?.setFacing(command.face);
    applyCommand(state, command);
    return true;
  },
  pose: async (scene: RoomScene, command: Of<'pose'>): Promise<boolean> => {
    const state = scene.session.state;
    scene.actors.get(command.actor)?.setPose(command.pose);
    applyCommand(state, command);
    return true;
  },
  say: async (scene: RoomScene, command: Of<'say'>): Promise<boolean> => {
    await say(scene, command.actor, command.text, command.at);
    return true;
  },
  setFlag: storyChange,
  addItem: storyChange,
  removeItem: storyChange,
  looked: async (scene: RoomScene, command: Of<'looked'>): Promise<boolean> => {
    const state = scene.session.state;
    applyCommand(state, command);
    return true;
  },
  handle: async (scene: RoomScene, command: Of<'handle'>): Promise<boolean> => {
    scene.props.swing(command.target);
    return true;
  },
  wait: async (scene: RoomScene, command: Of<'wait'>): Promise<boolean> => {
    await wait(scene, command.ms);
    return true;
  },
  shake: async (scene: RoomScene, command: Of<'shake'>): Promise<boolean> => {
    sound.rumble(command.ms);
    if (!scene.isCold()) scene.props.burst((scene.room.ambient?.glows ?? []).filter(g => g.warm));
    scene.sign?.jolt();
    if (!settings().reducedMotion) scene.cameras.main.shake(command.ms, 0.004);
    await wait(scene, Math.min(command.ms, 400));
    return true;
  },
  moveObject: async (scene: RoomScene, command: Of<'moveObject'>): Promise<boolean> => {
    const sprite = scene.objects.get(command.id);
    if (!sprite) return true;
    const sheet = scene.room.objects.find(o => o.id === command.id)!.sheet;
    const idle = sprite.anims.currentAnim?.key;
    if (scene.anims.exists(`${sheet}:scurry`)) sprite.play(`${sheet}:scurry`);
    if (sheet === 'sweeper') sound.brushes(command.ms);
    await new Promise<void>(resolve => scene.tweens.add({
      targets: sprite, x: command.x, y: command.y, duration: command.ms, ease: 'Sine.easeInOut',
      onUpdate: () => { sprite.setDepth(sprite.y); scene.objectShadows.get(command.id)?.setPosition(sprite.x, sprite.y - 1); },
      onComplete: () => resolve(),
    }));
    if (idle) sprite.play(idle);
    return true;
  },
  dialogue: async (scene: RoomScene, command: Of<'dialogue'>): Promise<boolean> => {
    await runDialogue(scene, command.id);
    return true;
  },
  room: async (scene: RoomScene, command: Of<'room'>): Promise<boolean> => {
    const state = scene.session.state;
    scene.leaving = true;
    scene.session.ui.closeRadial();
    const v = FACE_VECTOR[scene.hero.face];
    const out = { x: scene.hero.position.x + v.x * DOORWAY_STEP, y: scene.hero.position.y + v.y * DOORWAY_STEP };
    void scene.hero.walk([out]);
    scene.cameras.main.fadeOut(FADE_MS + 60, 0, 0, 0);
    await wait(scene, FADE_MS + 80);
    scene.hero.stop();
    applyCommand(state, command);
    scene.session.arrival = command.entry;
    scene.scene.restart();
    return false;
  },
  chapter: async (scene: RoomScene, command: Of<'chapter'>): Promise<boolean> => {
    const state = scene.session.state;
    // The next chapter opens at its start, with the slow fade of a new story.
    scene.leaving = true;
    scene.session.ui.closeRadial();
    scene.cameras.main.fadeOut(FADE_MS * 3, 0, 0, 0);
    await wait(scene, FADE_MS * 3 + 80);
    await loadChapter(command.id);
    applyCommand(state, command);
    setChapter(command.id);
    scene.session.arrival = null;
    scene.session.slowFadeIn = true;
    scene.scene.restart();
    return false;
  },
  learn: async (scene: RoomScene, command: Of<'learn'>): Promise<boolean> => {
    const before = scene.session.state.kit.techniques.length;
    applyCommand(scene.session.state, command);
    if (scene.session.state.kit.techniques.length > before) {
      sound.choose();
      scene.session.ui.toast(t('ui.learned', { name: TECHNIQUES[command.technique].name }));
    }
    return true;
  },
  giveSpares: async (scene: RoomScene, command: Of<'giveSpares'>): Promise<boolean> => {
    const state = scene.session.state;
    applyCommand(state, command);
    return true;
  },
  hatch: async (scene: RoomScene): Promise<boolean> => {
    await blowHatch(scene);
    return true;
  },
  fight: async (scene: RoomScene, command: Of<'fight'>): Promise<boolean> => {
    await fight(scene, command.id);
    return true;
  },
  gear: async (scene: RoomScene): Promise<boolean> => {
    await scene.session.ui.openGear();
    return true;
  },
  awaitGear: async (scene: RoomScene): Promise<boolean> => {
    await scene.session.ui.forceGear();
    return true;
  },
  shop: async (scene: RoomScene): Promise<boolean> => {
    await scene.session.ui.openShop();
    return true;
  },
  end: async (scene: RoomScene): Promise<boolean> => {
    scene.leaving = true;
    scene.cameras.main.fadeOut(900, 0, 0, 0);
    await wait(scene, 700);
    scene.session.ui.showEnd();
    return false;
  },
};
