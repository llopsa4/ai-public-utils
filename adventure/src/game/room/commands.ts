// What each script command does in the room: one handler per command type (src/engine/types.ts
// Command). A handler returns false when the script must stop (a room or chapter change, the end).
// The table is checked to cover every command type.
import { t } from '../../engine/i18n';
import { settings } from '../../engine/settings';
import { sound } from '../../audio/sound';
import { applyCommand } from '../../engine/state';
import { TECHNIQUES } from '../../content/kit';
import type { Command } from '../../engine/types';
import { CHAPTER_IDS, chapter, loadChapter, setChapter } from '../../chapters';
import type { RoomScene } from '../scenes';
import { runDialogue, say, wait } from './runner';
import { blowHatch, creatureFight, fight } from './fightBridge';
import { DOORWAY_STEP, FACE_VECTOR, FADE_MS } from './shared';
import { dayLine } from '../../ui/journalData';

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
  checkpoint: async scene=>{
    scene.syncHero();
    // Cinematics may walk beyond the camera; saves must keep a valid room position.
    Object.assign(scene.session.state.hero,scene.area.clamp(scene.session.state.hero));
    scene.session.saveNow();return true;
  },
  regulatorPuzzle: async scene=>{const {openRegulator}=await import('../../ui/regulator');return openRegulator(scene);},
  ashwaysBeat: async (scene,command)=>{await scene.ashways?.beat(command.phase);return true;},
  quietBeat: async scene=>{sound.hush(true);sound.music('cold');await say(scene,'hero','line.quietKiln');return true;},
  farewellReminder: async scene=>{
    const f=scene.session.state.flags;
    if(f.gotScarf||f.farewellReminded)return true;
    f.farewellReminded=true;scene.session.saveNow();
    await say(scene,'hero','line.farewellReminder');
    const answer=await scene.session.ui.choose([t('choice.farewellBack'),t('choice.farewellLeave')]);
    if(answer===0){await scene.hero.walk(scene.area.findPath(scene.hero.position,{x:195,y:300}));scene.syncHero();return false;}
    return true;
  },
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
  step: async (scene: RoomScene, command: Of<'step'>): Promise<boolean> => {
    const actor = scene.actors.get(command.actor);
    if (!actor) return true;
    actor.inFront = command.inFront ?? false;
    if (command.instant) actor.moveTo(command.to);
    else if (command.together) { void actor.walk([command.to]).then(() => { if (command.face && actor.sprite.active) actor.setFacing(command.face); }); return true; }
    else await actor.walk([command.to]);
    if (command.face) actor.setFacing(command.face);
    return true;
  },
  perform: async (scene: RoomScene, command: Of<'perform'>): Promise<boolean> => {
    scene.actors.get(command.actor)?.perform(command.tag);
    return true;
  },
  heroLayers: async (scene: RoomScene, command: Of<'heroLayers'>): Promise<boolean> => {
    const hero = scene.hero;
    if (!scene.textures.exists(command.sheet) || !hero?.sprite.active) { await wait(scene, command.ms); return true; }
    const frame = scene.textures.getFrame(command.sheet, command.layers[0].frame);
    const images = command.layers.map(l => scene.add.image(hero.sprite.x, hero.sprite.y, command.sheet, l.frame)
      .setOrigin(command.origin.x / frame.width, command.origin.y / frame.height)
      .setScale(Math.abs(hero.sprite.scaleX), Math.abs(hero.sprite.scaleY)).setDepth(l.depth));
    hero.sprite.setVisible(false);
    // Settles on the timer or when the scene shuts down (a load mid-beat), whichever comes first; a
    // shutdown stops the script, so nothing after the beat lands in the newly loaded game.
    const finished = await new Promise<boolean>(resolve => {
      const done = (completed: boolean) => { scene.events.off(Phaser.Scenes.Events.SHUTDOWN, stop); timer.remove(); resolve(completed); };
      const stop = () => done(false);
      const timer = scene.time.delayedCall(command.ms, () => done(true));
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stop);
    });
    for (const image of images) image.destroy();
    if (hero.sprite.active) hero.sprite.setVisible(true);
    return finished;
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
  fade: async (scene: RoomScene, command: Of<'fade'>): Promise<boolean> => {
    if (command.sound) sound[command.sound]();
    if (command.to === 'black') scene.cameras.main.fadeOut(command.ms, 0, 0, 0);
    else scene.cameras.main.fadeIn(command.ms, 0, 0, 0);
    await wait(scene, command.ms + 40);
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
    // The chapter may react to how the conversation went (src/engine/story.ts afterDialogue).
    for (const next of chapter().story.afterDialogue?.(command.id, scene.session.state) ?? []) {
      if (!(await (COMMANDS[next.type] as Handler<typeof next.type>)(scene, next as never))) return false;
    }
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
    const next = await loadChapter(command.id, { art: true });
    // Its opening lines over black, the first time he enters it.
    if (next.intro && !state.reached.includes(command.id)) await scene.session.ui.chapterIntro(next.intro, dayLine(next));
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
  creatureFight: async (scene: RoomScene, command: Of<'creatureFight'>): Promise<boolean> => {
    await creatureFight(scene, command.pool, command.from, command.land);
    return true;
  },
  hurt: async (scene: RoomScene, command: Of<'hurt'>): Promise<boolean> => {
    applyCommand(scene.session.state, command);
    sound.hiss(500);
    if (!settings().reducedMotion) scene.cameras.main.shake(200, 0.004);
    scene.session.ui.toast(t('ui.hurt', { n: String(command.amount), hp: String(scene.session.state.kit.hp) }));
    return true;
  },
  heal: async (scene: RoomScene, command: Of<'heal'>): Promise<boolean> => {
    applyCommand(scene.session.state, command);
    scene.session.ui.toast(t('ui.healed'));
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
    await fight(scene, command.id, undefined, command.practice);
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
  chooseChapter: async (scene: RoomScene, command: Of<'chooseChapter'>): Promise<boolean> => {
    if (command.reveal) {
      // The room fades to black (no zoom), then the far view of the Ashlands.
      scene.leaving = true;
      scene.session.ui.closeRadial();
      scene.cameras.main.fadeOut(2600, 0, 0, 0);
      await wait(scene, 2680);
      await scene.session.playReveal();
      await scene.session.chooseNextChapter({ calm: true });
      return false;
    }
    // The chapter ends to black; the chapter map offers what to play next.
    scene.leaving = true;
    scene.session.ui.closeRadial();
    scene.cameras.main.fadeOut(FADE_MS * 3, 0, 0, 0);
    await wait(scene, FADE_MS * 3 + 80);
    await scene.session.chooseNextChapter();
    return false;
  },
  end: async (scene: RoomScene): Promise<boolean> => {
    // ?debug: later chapters are playable, so the end of a chapter leads into the next one.
    const next = CHAPTER_IDS[CHAPTER_IDS.indexOf(scene.session.state.chapter) + 1];
    if (scene.session.debug && next) return COMMANDS.chapter(scene, { type: 'chapter', id: next });
    scene.leaving = true;
    scene.cameras.main.fadeOut(900, 0, 0, 0);
    await wait(scene, 700);
    scene.session.ui.showEnd();
    return false;
  },
};
