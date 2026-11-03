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

/**
 * The round hatch in the pipe breaks: the camera shakes, sparks and smoke pour from its dark
 * opening and bits of its brass rim fly off. Mara steps back; the scavenger drawn by the pulse
 * squeezes out of the opening (only what is inside the circle shows), leaps over the railing and
 * lands on the floor facing him.
 */
export async function blowHatch(scene: RoomScene): Promise<void> {
  const hatch = scene.room.hatch ?? { x: 265, y: 153, r: 44, stepBack: { x: 470, y: 302 }, land: { x: 396, y: 300 } };
  const calm = settings().reducedMotion;
  sound.rumble(500);
  sound.shatter();
  if (!calm) scene.cameras.main.shake(450, 0.008);
  const rim = (k: number) => Array.from({ length: k }, (_, i) => {
    const a = (i / k) * Math.PI * 2;
    return { x: hatch.x + Math.cos(a) * hatch.r * 0.8, y: hatch.y + Math.sin(a) * hatch.r * 0.8 };
  });
  scene.props.burst([{ x: hatch.x, y: hatch.y }, ...rim(6)]);
  for (let i = 0; i < 8; i++) scene.time.delayedCall(i * 110, () => scene.props.step(hatch.x + (Math.random() - 0.5) * hatch.r, hatch.y + (Math.random() - 0.5) * hatch.r));
  // Bits of the brass rim fly out and fall away.
  if (!calm) {
    for (const [n, p] of rim(10).entries()) {
      const bit = scene.add.graphics().setDepth(1000).setPosition(p.x, p.y);
      bit.fillStyle(n % 2 ? 0x8a6a3a : 0x5a4630, 1).fillTriangle(-3, -2, 4, -1, -1, 3);
      const dx = p.x - hatch.x, dy = p.y - hatch.y;
      scene.tweens.add({ targets: bit, x: p.x + dx * 1.6, duration: 900, ease: 'Linear' });
      scene.tweens.add({ targets: bit, y: p.y + dy * 0.8 + 150, duration: 900, ease: 'Quad.easeIn' });
      scene.tweens.add({ targets: bit, angle: (Math.random() - 0.5) * 720, alpha: 0, duration: 900, onComplete: () => bit.destroy() });
    }
  }
  // Mara steps back from it.
  if (scene.hero.pose !== 'stand') scene.hero.setPose('stand');
  const back = scene.hero.walk(scene.area.findPath(scene.hero.position, hatch.stepBack));
  await wait(scene, calm ? 200 : 600);
  await new Promise<void>(resolve => {
    const emerge = () => {
      const crawler = scene.add.image(hatch.x, hatch.y, 'battle-scavenger').setOrigin(0.5, 0.5).setScale(0.08).setFlipX(true).setDepth(0);
      const hole = scene.make.graphics({}, false).fillCircle(hatch.x, hatch.y, hatch.r);
      crawler.setMask(hole.createGeometryMask());
      scene.hatchCreature = crawler;
      sound.scrape(1);
      // Out of the opening: it grows as it pushes through, still inside the circle.
      scene.tweens.add({
        targets: crawler, scale: 0.24, duration: calm ? 250 : 900, ease: 'Quad.easeOut',
        onComplete: () => {
          crawler.clearMask(true);
          crawler.setDepth(1000).setOrigin(0.5, 1).setY(hatch.y + crawler.displayHeight / 2);
          // The leap: across and down in an arc, growing to its size on the floor.
          const from = { x: crawler.x, y: crawler.y };
          const to = hatch.land;
          const lift = 60;
          scene.tweens.addCounter({
            from: 0, to: 1, duration: calm ? 250 : 650, ease: 'Sine.easeIn',
            onUpdate: tween => {
              const k = tween.getValue() ?? 0;
              crawler.setPosition(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * lift);
              crawler.setScale(0.24 + (0.42 - 0.24) * k);
            },
            onComplete: () => {
              crawler.setDepth(to.y);
              sound.strike(4);
              if (!calm) scene.cameras.main.shake(180, 0.006);
              for (let i = 0; i < 5; i++) scene.props.step(to.x + (i - 2) * 12, to.y);
              resolve();
            },
          });
        },
      });
    };
    if (scene.textures.exists('battle-scavenger')) emerge();
    else { scene.load.image('battle-scavenger', SCAVENGER_SPRITE); scene.load.once(Phaser.Loader.Events.COMPLETE, emerge); scene.load.start(); }
  });
  await back;
  scene.syncHero();
  scene.hero.setFacing('left');
}

/**
 * A fight: save first (a reload restarts it), shatter the room, then Kiln Courier's battle screen
 * (React: FFCardGame's code through src/kc/mount.tsx) over everything. The script carries on once it is won.
 */
export async function fight(scene: RoomScene, id: string): Promise<void> {
  const state = scene.session.state;
  scene.syncHero();
  scene.session.saveNow();
  sound.hush(true);
  sound.music('combat');
  scene.session.ui.setHover('');
  const kcModule = import('../../kc/mount');
  screenOut(true);
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
      profile: maraProfile(state.kit), guided: guided(chapter().story, scene.storyContext()), encounter: chapter().encounters[id], lessonPrompts: chapter().lessonPrompts, rewards,
      loot: reward ? [{ kind: 'salvage' as const, id: 'salvage', amount: reward.salvage, name: t('battle.salvage') },
        ...Object.entries(reward.materials).map(([m, n]) => ({ kind: 'material' as const, id: m, amount: n, name: t(MATERIALS[m].name) }))] : [],
      onLootShown: () => sound.pickup(),
      tonics: () => state.bag.tonics,
      drink: battle => { const next = drinkTonic(battle, state.bag); return next === battle ? null : next; },
      onMenu: () => scene.session.ui.openMenu(),
      onWin: battle => {
        finishBattle(state, battle, reward);
        scene.session.closeBattle = null;
        close();
        el.hidden = true;
        screenOut(false);
        resolve();
      },
    });
    scene.session.closeBattle = () => { close(); el.hidden = true; screenOut(false); };
  });
  scene.scene.resume();
  cover.destroy();
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
  // Placed at the room's own coordinates (its camera is zoomed and never scrolls), like the room art.
  const black = scene.add.graphics().setDepth(100000);
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
    const shard = scene.add.image(x, y, key, name).setScale(k).setDepth(100001);
    shards.push(shard);
    const d = Math.hypot(x - centre.x, y - centre.y);
    scene.tweens.add({
      targets: shard, delay: 120 + d * 1.2, duration: 700 + Math.random() * 300, ease: 'Quad.easeIn',
      y: y + 260 + Math.random() * 120, x: x + (x - centre.x) * 0.35, angle: (Math.random() - 0.5) * 70, alpha: 0,
    });
  }
  // The flash covers the whole screen (menu bar and margins too), like the fade.
  const flash = document.createElement('div');
  flash.className = 'screen-flash';
  document.body.append(flash);
  await wait(scene, 1500);
  for (const shard of shards) shard.destroy();
  flash.remove();
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return black;
}

/**
 * The rest of the screen follows the room into a fight: the menu bar and the text over the stage
 * fade out and the page around the stage turns black (style.css, `html.battle-out`); they come
 * back when the fight is over.
 */
export function screenOut(out: boolean): void {
  document.documentElement.classList.toggle('battle-out', out);
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
