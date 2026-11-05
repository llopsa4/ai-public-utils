// The room scene's input: pointer, hover, the focus ring for keyboard play, hit testing and the action rings.
import Phaser from 'phaser';
import { conditionsHold, pointInPolygon } from '../../engine/geometry';
import { t } from '../../engine/i18n';
import { sound } from '../../audio/sound';
import type { ActorId, Command, Point, Verb } from '../../engine/types';
import { type Member } from '../Crowd';
import { chapter } from '../../chapters';
import { cursorFor, type CursorKind } from '../../ui/cursors';
import type { RoomScene } from '../scenes';
import type { Target } from './shared';
import { runScript } from './runner';
import { withHandling } from './shared';
import { showOutline } from './outline';

// ------------------------------------------------------------------ input ---
export function onPointerDown(scene: RoomScene, pointer: Phaser.Input.Pointer): void {
  const ui = scene.session.ui;
  ui.controls.stopMovement();
  ui.controls.cancelPendingClick();
  clearFocus(scene);
  if (scene.isBusy()) { ui.skip(); return; }
  if (pointer.rightButtonDown()) {
    scene.session.selectItem(null);
    return;
  }
  const at = { x: pointer.worldX, y: pointer.worldY };
  const target = hitTest(scene, at);
  const item = scene.session.selectedItem;

  if (item) {
    useCarriedItem(scene, item, target ? targetId(target) : null, at);
    return;
  }
  if (target && target.kind === 'hotspot' && target.hotspot.verbs.includes('go')) {
    const now = scene.time.now;
    if (scene.lastExitClick.id === target.hotspot.id && now - scene.lastExitClick.time < 400) {
      ui.closeRadial();
      scene.lastExitClick = { id: '', time: 0 };
      void runScript(scene, chapter().interact(scene.session.state, 'go', target.hotspot.id).filter(c => c.type !== 'walk'));
      return;
    }
    scene.lastExitClick = { id: target.hotspot.id, time: now };
  }
  if (target) {
    openTargetRing(scene, target, at);
    return;
  }
  void scene.walkTo(at);
}

/** One item-use path for scene clicks, inventory pairs, keyboard activation and drops. */
export function useCarriedItem(scene: RoomScene, item: string, target: string | null, at?: Point): void {
  if (!scene.session.ui.controls.available() || !scene.session.state.inventory.includes(item)) {
    scene.session.ui.controls.cancel(); return;
  }
  scene.session.ui.controls.stopMovement();
  scene.session.selectItem(null);
  scene.input.setDefaultCursor(cursorFor(null));
  clearFocus(scene);
  if (target) void runScript(scene, chapter().interact(scene.session.state, 'use', target, item));
  else if (at) void scene.walkTo(at);
}

export function openTargetRing(scene: RoomScene, target: Target, at: Point): void {
  if (target.kind === 'extra') { openExtraRing(scene, target.member, at); return; }
  const id = targetId(target);
  const verbs: Verb[] = target.kind === 'actor' ? chapter().actorVerbs[target.actor.id as ActorId] ?? [] : target.hotspot.verbs;
  sound.blip();
  scene.session.ui.openRadial(at, targetName(scene, target), verbs, verb => {
    void runScript(scene, withHandling(chapter().interact(scene.session.state, verb, id), verb, id));
  });
}

/** Background people: look, or talk (they stop, turn to Mara and say a line; nothing else changes). */
export function openExtraRing(scene: RoomScene, m: Member, at: Point): void {
  const crowd = scene.crowd;
  if (!crowd) return;
  sound.blip();
  scene.session.ui.openRadial(at, crowd.name(m), ['look', 'talk'], verb => {
    if (verb === 'look') { void runScript(scene, [{ type: 'say', actor: 'hero', text: crowd.lookLine(m) }]); return; }
    crowd.hold(m);
    const spot = crowd.talkSpot(m);
    const met = m.def.met;
    void runScript(scene, [
      { type: 'walk', to: spot.at, face: spot.face },
      { type: 'say', actor: m.def.id, text: crowd.nextLine(m) },
      ...(!met || scene.session.state.flags[met] ? [] : [{ type: 'setFlag', flag: met, value: true } as Command]),
      ...(m.def.shop ? [{ type: 'shop' } as Command, { type: 'setFlag', flag: 'metMerchant', value: true } as Command] : []),
    ]).finally(() => crowd.release(m));
  });
}

// ---------------------------------------------------------- keyboard play ---
/** Everything Tab can reach, left to right (secrets stay hidden). */
export function focusTargets(scene: RoomScene): { target: Target; box: Phaser.Geom.Rectangle }[] {
  const state = scene.session.state;
  const list: { target: Target; box: Phaser.Geom.Rectangle }[] = [];
  for (const hotspot of scene.room.hotspots) {
    if (hotspot.secret || !conditionsHold(state, hotspot.visibleIf)) continue;
    const xs = hotspot.polygon.map(p => p.x), ys = hotspot.polygon.map(p => p.y);
    const x = Math.min(...xs), y = Math.min(...ys);
    list.push({ target: { kind: 'hotspot', hotspot }, box: new Phaser.Geom.Rectangle(x, y, Math.max(...xs) - x, Math.max(...ys) - y) });
  }
  for (const actor of scene.actors.values()) list.push({ target: { kind: 'actor', actor }, box: actor.hitBox() });
  for (const member of scene.crowd?.visible() ?? []) list.push({ target: { kind: 'extra', member }, box: member.actor.hitBox() });
  return list.sort((a, b) => a.box.centerX - b.box.centerX);
}

/** Moves the focus ring. Returns false when it runs past either end (focus then goes to the bar). */
export function cycleFocus(scene: RoomScene, direction: 1 | -1): boolean {
  if (scene.isBusy()) return false;
  const targets = focusTargets(scene);
  const next = scene.focusIndex === -1 ? (direction === 1 ? 0 : targets.length - 1) : scene.focusIndex + direction;
  if (next < 0 || next >= targets.length) { clearFocus(scene); return false; }
  scene.focusIndex = next;
  const { target, box } = targets[next];
  const pad = 3;
  scene.focusRing?.clear().lineStyle(1.5, 0xe7c046, 1).strokeRoundedRect(box.x - pad, box.y - pad, box.width + pad * 2, box.height + pad * 2, 4);
  scene.session.ui.setHover(targetName(scene, target), { x: box.centerX, y: box.y });
  scene.session.ui.announce(targetName(scene, target));
  return true;
}

export function activateFocus(scene: RoomScene): boolean {
  if (scene.focusIndex === -1 || scene.isBusy()) return false;
  const entry = focusTargets(scene)[scene.focusIndex];
  if (!entry) return false;
  const item = scene.session.selectedItem;
  if (item) useCarriedItem(scene, item, targetId(entry.target));
  else openTargetRing(scene, entry.target, { x: entry.box.centerX, y: entry.box.centerY });
  return true;
}

export function clearFocus(scene: RoomScene): void {
  scene.focusIndex = -1;
  scene.focusRing?.clear();
}

/** Name labels for every interactive thing in the room (hold Space / eye button). */
export function hotspotLabels(scene: RoomScene): { text: string; x: number; y: number }[] {
  const state = scene.session.state;
  const labels = scene.room.hotspots
    .filter(h => !h.secret && conditionsHold(state, h.visibleIf))
    .map(h => {
      const xs = h.polygon.map(p => p.x), ys = h.polygon.map(p => p.y);
      return { text: t(h.name), x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
    });
  for (const [id, actor] of scene.actors) labels.push({ text: t(`name.${id}`), ...actor.headPoint() });
  for (const m of scene.crowd?.visible() ?? []) labels.push({ text: scene.crowd!.name(m), ...m.actor.headPoint() });
  return labels;
}

/** Action ring for an inventory item, shown just above the bar. */
export function openItemRing(scene: RoomScene, item: string, index: number): void {
  if (scene.isBusy()) return;
  sound.blip();
  const at = { x: 70 + index * 46, y: 300 };
  scene.session.ui.openRadial(at, t(`name.${item}`), chapter().itemVerbs, verb => {
    if (verb === 'use') scene.session.selectItem(item);
    else void runScript(scene, chapter().interact(scene.session.state, verb, `item:${item}`));
  });
}

export function onPointerMove(scene: RoomScene, pointer: Phaser.Input.Pointer): void {
  if (pointer.wasTouch) return;
  const at = { x: pointer.worldX, y: pointer.worldY };
  const target = scene.isBusy() ? null : hitTest(scene, at);
  scene.hovered = target;
  const item = scene.session.selectedItem;
  const name = target ? targetName(scene, target) : '';
  if (item) {
    const itemName = t(`name.${item}`);
    scene.session.ui.setHover(name ? t('ui.useWith', { item: itemName, target: name }) : t('ui.useWithNothing', { item: itemName }), at);
  } else {
    scene.session.ui.setHover(name, at);
  }
  // While an item is carried, the stage shows the item's icon as the cursor instead.
  scene.input.setDefaultCursor(item ? '' : cursorFor(target ? cursorKind(target) : null));
}

/** What a click on the target will most likely do: talk, leave, handle or look. */
export function cursorKind(target: Target): CursorKind {
  if (target.kind === 'extra') return 'talk';
  if (target.kind === 'actor') return target.actor.id === 'hero' ? 'look' : 'talk';
  const verbs = target.hotspot.verbs;
  if (verbs.includes('go')) return 'exit';
  if (verbs.includes('talk')) return 'talk';
  if (verbs.some(v => v === 'take' || v === 'use' || v === 'open')) return 'hand';
  return 'look';
}

export function hitTest(scene: RoomScene, p: Point): Target | null {
  const actors = [...scene.actors.values()].sort((a, b) => b.sprite.depth - a.sprite.depth);
  for (const actor of actors) if (actor.hitBox().contains(p.x, p.y)) return { kind: 'actor', actor };
  const member = scene.crowd?.hit(p);
  if (member) return { kind: 'extra', member };
  for (const hotspot of scene.room.hotspots) {
    if (conditionsHold(scene.session.state, hotspot.visibleIf) && pointInPolygon(p, hotspot.polygon)) return { kind: 'hotspot', hotspot };
  }
  return null;
}

export function targetId(target: Target): string {
  return target.kind === 'actor' ? target.actor.id : target.kind === 'extra' ? target.member.def.id : target.hotspot.id;
}

export function targetName(scene: RoomScene, target: Target): string {
  if (target.kind === 'extra') return scene.crowd?.name(target.member) ?? '';
  return t(target.kind === 'actor' ? `name.${target.actor.id}` : target.hotspot.name);
}

/**
 * A soft gold outline around the silhouette of what the pointer is over: a thing painted into the
 * room, an object, a prop or a person (room/outline.ts). A hotspot with no known silhouette has its
 * click area traced instead. Hidden while busy and while the action ring is open.
 */
export function drawHover(scene: RoomScene, time: number): void {
  const ring = scene.hoverRing;
  if (!ring) return;
  ring.clear();
  const target = scene.hovered && !scene.isBusy() && !scene.session.ui.ringOpen() ? scene.hovered : null;
  if (showOutline(scene, target, time) || target?.kind !== 'hotspot') return;
  const pulse = 0.55 + 0.2 * Math.sin(time / 260);
  const pts = target.hotspot.polygon;
  ring.lineStyle(4, 0xffc860, 0.18 * pulse).strokePoints(pts, true, true);
  ring.lineStyle(1.2, 0xffe2a0, 0.7 * pulse).strokePoints(pts, true, true);
}
