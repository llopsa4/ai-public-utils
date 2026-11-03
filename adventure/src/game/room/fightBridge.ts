// From the room to a fight and back: the hatch set piece, the shatter transition and the battle screen.
import Phaser from 'phaser';
import { drinkTonic, finishBattle } from '../../engine/kit';
import { t } from '../../engine/i18n';
import { settings } from '../../engine/settings';
import { sound } from '../../audio/sound';
import SCAVENGER_SPRITE from '../../../art/src/battle/scavenger.png';
import { MATERIALS, maraProfile } from '../../content/kit';
import { chapter } from '../../chapters';
import { guided } from '../../engine/story';
import { LOGICAL_H, LOGICAL_W } from '../../ui/ui';
import type { RoomScene } from '../scenes';
import { wait } from './runner';

export async function blowHatch(scene: RoomScene): Promise<void> {
  const at = scene.room.hatch ?? { x: 360, y: 260 };
  const calm = settings().reducedMotion;
  sound.rumble(500);
  sound.shatter();
  if (!calm) scene.cameras.main.shake(450, 0.008);
  // The hole: a dark oval with a ragged metal rim, drawn on the floor.
  const hole = scene.add.graphics().setDepth(at.y - 2);
  hole.fillStyle(0x060404, 1).fillEllipse(at.x, at.y, 64, 15);
  hole.lineStyle(2, 0x5a4a3c, 1).strokeEllipse(at.x, at.y, 66, 16);
  hole.fillStyle(0xff8a3a, 0.35).fillEllipse(at.x, at.y + 1, 34, 6);
  scene.hatchHole = hole;
  // The cover flies off, spinning, and clatters down to one side.
  const cover = scene.add.graphics().setDepth(at.y + 40).setPosition(at.x, at.y);
  cover.fillStyle(0x4a4038, 1).fillEllipse(0, 0, 60, 14);
  cover.lineStyle(2, 0x2a2420, 1).strokeEllipse(0, 0, 60, 14);
  cover.fillStyle(0x6a5a4a, 1).fillRect(-14, -2, 28, 4);
  if (calm) cover.setPosition(at.x - 70, at.y + 18);
  else {
    scene.tweens.add({ targets: cover, x: at.x - 70, duration: 900, ease: 'Linear' });
    scene.tweens.add({ targets: cover, y: at.y - 70, duration: 420, ease: 'Quad.easeOut', yoyo: false,
      onComplete: () => scene.tweens.add({ targets: cover, y: at.y + 18, duration: 480, ease: 'Bounce.easeOut' }) });
    scene.tweens.add({ targets: cover, angle: 540, duration: 900, ease: 'Quad.easeOut' });
  }
  scene.props.burst([{ x: at.x, y: at.y - 6 }, { x: at.x + 8, y: at.y - 4 }, { x: at.x - 8, y: at.y - 4 }]);
  for (let i = 0; i < 8; i++) scene.time.delayedCall(i * 110, () => scene.props.step(at.x + (Math.random() - 0.5) * 30, at.y - Math.random() * 6));
  await wait(scene, calm ? 200 : 700);
  // The scavenger climbs out: only what is above the rim shows while it rises.
  await new Promise<void>(resolve => {
    const climb = () => {
      const crawler = scene.add.image(at.x, at.y, 'battle-scavenger').setOrigin(0.5, 1).setScale(0.42).setFlipX(true).setDepth(at.y);
      const full = crawler.displayHeight;
      crawler.setY(at.y + full);
      const rim = scene.make.graphics({}, false).fillRect(at.x - 120, 0, 240, at.y);
      crawler.setMask(rim.createGeometryMask());
      scene.hatchCreature = crawler;
      sound.scrape(1);
      scene.tweens.add({
        targets: crawler, y: at.y, duration: calm ? 300 : 1100, ease: 'Quad.easeOut',
        onComplete: () => {
          crawler.clearMask(true);
          sound.strike(4);
          scene.tweens.add({ targets: crawler, x: at.x - 12, y: at.y + 6, duration: calm ? 200 : 600, ease: 'Sine.easeInOut', onComplete: () => resolve() });
        },
      });
    };
    if (scene.textures.exists('battle-scavenger')) climb();
    else { scene.load.image('battle-scavenger', SCAVENGER_SPRITE); scene.load.once(Phaser.Loader.Events.COMPLETE, climb); scene.load.start(); }
  });
  scene.hero.setFacing('left');
}

/**
 * A fight: save first (a reload restarts it), shatter the room, then Kiln Courier's battle screen
 * (React, src/kc) over everything. The script carries on once it is won.
 */
export async function fight(scene: RoomScene, id: string): Promise<void> {
  const state = scene.session.state;
  scene.syncHero();
  scene.session.saveNow();
  sound.hush(true);
  sound.music('combat');
  scene.session.ui.setHover('');
  const kcModule = import('../../kc/mount');
  const cover = await shatter(scene);
  const kc = await kcModule;
  scene.hatchCreature?.destroy();
  scene.hatchCreature = null;
  const el = document.getElementById('kc-root')!;
  el.hidden = false;
  scene.scene.pause();
  await new Promise<void>(resolve => {
    const reward = chapter().rewards[id];
    const rewards = reward ? [t('battle.rewardSalvage', { n: String(reward.salvage) }),
      ...Object.entries(reward.materials).map(([m, n]) => t('battle.rewardMaterial', { n: String(n), name: t(MATERIALS[m].name) }))] : [];
    const close = kc.mountBattle(el, {
      profile: maraProfile(state.kit), guided: guided(chapter().story, scene.storyContext()), encounter: chapter().encounters[id], rewards,
      tonics: () => state.bag.tonics,
      drink: battle => { const next = drinkTonic(battle, state.bag); return next === battle ? null : next; },
      onMenu: () => scene.session.ui.openMenu(),
      onWin: battle => {
        finishBattle(state, battle, reward);
        scene.session.closeBattle = null;
        close();
        el.hidden = true;
        resolve();
      },
    });
    scene.session.closeBattle = () => { close(); el.hidden = true; };
  });
  scene.scene.resume();
  cover.destroy();
  scene.hatchHole?.setAlpha(0.6);
  scene.session.ui.renderInventory();
  sound.music('nervous');
  scene.cameras.main.fadeIn(700, 0, 0, 0);
  await wait(scene, 500);
}

/**
 * The room breaks into shards that fall away with a white flash, leaving black (the battle screen
 * then appears over it). Returns the black cover, removed after the fight.
 */
export async function shatter(scene: RoomScene): Promise<Phaser.GameObjects.Graphics> {
  const black = scene.add.graphics().setDepth(100000).setScrollFactor(0);
  if (settings().reducedMotion) {
    scene.cameras.main.fadeOut(400, 0, 0, 0);
    await wait(scene, 420);
    black.fillStyle(0x000000, 1).fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    scene.cameras.main.resetFX();
    return black;
  }
  const key = await snapshot(scene);
  black.fillStyle(0x000000, 1).fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  const tex = scene.textures.get(key);
  const src = tex.getSourceImage() as HTMLImageElement;
  const cols = 8, rows = 5, w = src.width / cols, h = src.height / rows, k = LOGICAL_W / src.width;
  const centre = { x: scene.hero.position.x, y: scene.hero.position.y - 60 };
  const shards: Phaser.GameObjects.Image[] = [];
  sound.shatter();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const name = `shard-${r}-${c}`;
    if (!tex.has(name)) tex.add(name, 0, c * w, r * h, w, h);
    const x = (c + 0.5) * w * k, y = (r + 0.5) * h * k;
    const shard = scene.add.image(x, y, key, name).setScale(k).setDepth(100001).setScrollFactor(0);
    shards.push(shard);
    const d = Math.hypot(x - centre.x, y - centre.y);
    scene.tweens.add({
      targets: shard, delay: 120 + d * 1.2, duration: 700 + Math.random() * 300, ease: 'Quad.easeIn',
      y: y + 260 + Math.random() * 120, x: x + (x - centre.x) * 0.35, angle: (Math.random() - 0.5) * 70, alpha: 0,
    });
  }
  const flash = scene.add.graphics().setDepth(100002).setScrollFactor(0);
  flash.fillStyle(0xffffff, 0.85).fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  scene.tweens.add({ targets: flash, alpha: 0, duration: 260 });
  await wait(scene, 1500);
  for (const shard of shards) shard.destroy();
  flash.destroy();
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return black;
}

/** The canvas as it is now, as a texture (for the shatter). */
export function snapshot(scene: RoomScene): Promise<string> {
  const key = 'battle-snapshot';
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return new Promise(resolve => {
    scene.game.renderer.snapshot(image => {
      scene.textures.addImage(key, image as HTMLImageElement);
      resolve(key);
    });
  });
}
