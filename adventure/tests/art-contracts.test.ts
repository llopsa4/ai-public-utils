import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { walkPose, walkMetadata, point, type LayeredConfig } from '../art/layered-rig.mjs';
import { walkFrameAt, walkTiming, LEGACY_WALK } from '../src/game/walk';
import { CH1 } from '../src/chapters/ch1';
import { STORY as CH2_STORY } from '../src/chapters/ch2/story';
import { ROOMS as CH2_ROOMS, START_ROOM as CH2_START_ROOM } from '../src/chapters/ch2/rooms';
import { newGame } from '../src/engine/state';
import { equip } from '../src/engine/kit';
import { heroSheetFor } from '../src/engine/story';
import { MANIFEST, RIGS } from '../art/manifest.mjs';
import { NPC_IDS } from '../src/engine/types';
import { PORTRAIT_MOODS } from '../src/content/art';
import { createHash } from 'node:crypto';
import { EXTRAS } from '../src/chapters/ch1/crowd';
import { isFinal } from '../art/guard.mjs';
import { ROOMS as INTRO_ROOMS } from '../src/chapters/intro/rooms';

// JSON-only fixtures: no PNG decoding, layer compositing, or chapter preloading in this file.
const configs = ['casual', 'light', 'medium'].map(id =>
  JSON.parse(readFileSync(new URL(`../art/sources/characters/mara-${id}-layered/rig.json`, import.meta.url), 'utf8')) as LayeredConfig);
const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('approved standing portraits cover speaking workers and preserve the reviewed frames', () => {
  const delivery = JSON.parse(readFileSync(new URL('../art/sources/dialogue-portraits/approved-r2.json', import.meta.url), 'utf8'));
  assert.equal(delivery.portraits.length, 16);
  const ids = new Set(delivery.portraits.map((p: { id: string }) => p.id));
  for (const extra of EXTRAS) assert.ok(ids.has(extra.id), `${extra.id} has a dialogue portrait`);
  for (const portrait of delivery.portraits) {
    const entry = MANIFEST.find(e => e.id === `portrait-${portrait.id}`)!;
    assert.ok(entry, `${portrait.id} is registered`);
    assert.equal(entry.file, portrait.file);
    assert.equal(entry.status, 'final');
    assert.ok(isFinal(portrait.file), `${portrait.id} is protected from generators`);
    assert.deepEqual(PORTRAIT_MOODS[portrait.id], portrait.moods);
    const bytes = readFileSync(new URL(`../art/src/${portrait.file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), portrait.sha256, `${portrait.id} matches the currently approved export`);
    const approved = readFileSync(new URL(`../${portrait.approvedFile}`, import.meta.url));
    assert.equal(createHash('sha256').update(approved).digest('hex'), portrait.approvedSha256, `${portrait.id} retains the reviewed source`);
    assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [portrait.moods.length * 512, 256]);
  }
});

test('Bryn retains the approved smith sources and independently protected neutral portrait', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/characters/char-bryn/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.sourceHashes)) {
    const bytes = readFileSync(new URL(`../art/sources/characters/char-bryn/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `approved Bryn source ${file}`);
  }
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    const bytes = readFileSync(new URL(`../art/src/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `approved Bryn output ${file}`);
  }
  assert.equal(RIGS.bryn.source, 'sources/characters/char-bryn/body.png');
  assert.equal(RIGS.bryn.variant, undefined, 'the shield placeholder recolour is gone');
  assert.ok(isFinal('ch2/portraits/bryn.png'));
  assert.deepEqual(PORTRAIT_MOODS.bryn, ['neutral']);
});

test('C6 retains the approved machine artwork and protected Sigrid colour exports', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/characters/sigrid-colour-c6/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.sourceHashes)) {
    const bytes = readFileSync(new URL(`../art/sources/characters/sigrid-colour-c6/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `C6 source ${file}`);
  }
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    const bytes = readFileSync(new URL(`../art/src/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `C6 installed ${file}`);
    assert.ok(isFinal(file), `${file} is protected`);
  }
  assert.equal(MANIFEST.find(e => e.id === 'battle-enemy-rig')!.file, 'kc/training-rig.webp');
  assert.equal(MANIFEST.find(e => e.id === 'battle-enemy-ash-sweeper')!.file, 'kc/brown-sweeper.webp');
});

test('C7 retains the approved guardroom pixels and registered removable/stateful overlays', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/guardroom-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    const bytes = readFileSync(new URL(`../art/src/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `approved C7 ${file}`);
    assert.ok(isFinal(file), `${file} is protected`);
  }
  const room = INTRO_ROOMS.guardroom;
  const grate = room.objects.find(o => o.id === 'grate')!;
  assert.equal(grate.flag, 'grateOpen', 'existing save progress drives the visible gate');
  const atlas = JSON.parse(readFileSync(new URL('../art/src/intro/objects/guardroom-grate.json', import.meta.url), 'utf8'));
  for (const [open, expected] of [[false, 0], [true, 1]] as const) {
    const tag = open ? grate.whenTrue : grate.whenFalse;
    const frame = atlas.meta.frameTags.find((t: { name: string }) => t.name === tag);
    assert.equal(frame.from, expected);
    assert.deepEqual(atlas.frames[frame.from].sourceSize, { w: 176, h: 324 });
  }
  assert.deepEqual([grate.x, grate.y], [596, 264]);
  const ledger = room.objects.find(o => o.id === 'ledger')!;
  assert.deepEqual(ledger.visibleIf, [{ notFlag: 'tookLedger' }]);
  const stove = room.objects.find(o => o.id === 'stove')!;
  assert.deepEqual([stove.sheet, stove.x, stove.y], ['guardroom-stove', 330, 262]);
  assert.equal(room.objects.filter(o => o.sheet === 'guardroom-torch').length, 3);
});

test('C7 cell retains approved layers and existing save-driven item visibility', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/cell-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries({ ...approval.installedHashes, ...approval.preservedHashes })) {
    const bytes = readFileSync(new URL(`../art/src/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `C7 cell approved/preserved ${file}`);
    assert.ok(isFinal(file), `${file} is protected`);
  }
  const room = INTRO_ROOMS.cell;
  assert.equal(room.backgroundWhen, undefined, 'a taken cloak must not replace the clean room');
  assert.equal(MANIFEST.some(e => e.id === 'room-cell-bare'), false);
  const byId = (id: string) => room.objects.find(o => o.id === id)!;
  assert.deepEqual(byId('cloak').visibleIf, [{ notFlag: 'tookCloak' }]);
  assert.deepEqual(byId('floorPlate').visibleIf, [{ notFlag: 'tookPlate' }]);
  assert.deepEqual(byId('windowPlate').visibleIf, [{ flag: 'cellLit' }]);
  assert.deepEqual(byId('frame').visibleIf, [{ flag: 'cellLit' }, { notFlag: 'gotFrame' }]);
  for (const id of ['cot', 'blanket', 'bucket', 'roster', 'table', 'candle', 'cloak']) {
    assert.ok(byId(id), `${id} has an independent layer`);
    assert.deepEqual(room.hotspots.find(h => h.id === id)!.outline, { objects: [id] });
  }
  assert.deepEqual([byId('cot').x, byId('cot').y, byId('blanket').x, byId('blanket').y], [95, 289, 95, 283]);
  assert.deepEqual([byId('frame').y, byId('candle').y, byId('tableStub').y], [280, 280, 280]);
  assert.deepEqual([byId('cellDoor').x, byId('cellDoor').y, byId('cellDoor').flag], [183, 338, 'cellOpen']);
  assert.ok(room.props?.some(p => p.kind === 'flame' && p.x === 473 && p.y === 266));
  assert.equal(room.ambient?.drips?.[0].bottom, 266);
});

test('C7 outer door preserves approved pixels and two independently registered lanterns', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/outer-door-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    const bytes = readFileSync(new URL(`../art/src/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `approved outer door ${file}`);
    assert.ok(isFinal(file), `${file} is protected`);
  }
  const room = INTRO_ROOMS.outerDoor;
  assert.equal(room.background, 'room-prison-door');
  assert.deepEqual(room.objects.map(o => [o.id, o.sheet, o.x, o.y]), [
    ['lantern1', 'outer-lantern', 142, 130], ['lantern2', 'outer-lantern', 330, 130],
  ]);
  const atlas = JSON.parse(readFileSync(new URL('../art/src/intro/objects/outer-lantern.json', import.meta.url), 'utf8'));
  assert.deepEqual(atlas.frames[0].sourceSize, { w: 40, h: 44 });
  assert.deepEqual(room.props?.filter(p => p.kind === 'flame').map(p => [p.x, p.y, p.size]), [[142, 122, 4], [330, 122, 4]]);
});

test('C7 tent preserves approved layers, tabletop depth and save-driven cradle/notebook states', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/tent-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries({ ...approval.installedHashes, ...approval.preservedHashes })) {
    const bytes = readFileSync(new URL(`../art/src/${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `approved tent ${file}`);
    assert.ok(isFinal(file), `${file} is protected`);
  }
  const room = CH1.rooms.tent;
  const byId = (id: string) => room.objects.find(o => o.id === id)!;
  for (const id of ['workbench', 'jar', 'chest', 'drum', 'stove']) {
    const spec = approval.registration.specs[`tent-${id}`];
    const object = byId(id);
    assert.equal(object.sheet, `tent-${id}`);
    assert.deepEqual([object.x, object.y], [(spec.origin[0] + spec.anchor[0]) / 2, (spec.origin[1] + spec.anchor[1]) / 2]);
    assert.deepEqual(room.hotspots.find(h => h.id === id)!.outline, { objects: [id] });
  }
  const benchDepth = byId('workbench').depth!;
  for (const id of ['rack', 'notebook', 'chest']) assert.ok(byId(id).depth! > benchDepth);
  assert.ok(byId('jar').depth! > benchDepth, 'new jug stands above the revised bench');
  assert.equal(approval.revision, 'scene-redraw-tent/r2');
  for (const [id, position, frame] of [['rack', [165, 208], [40, 52]], ['notebook', [50, 208], [40, 14]]] as const) {
    assert.deepEqual([byId(id).x, byId(id).y], position);
    const entry = MANIFEST.find(e => e.id === id)!;
    assert.deepEqual(entry.frame, { w: frame[0], h: frame[1] });
  }
  assert.ok(room.props?.some(p => p.kind === 'flame' && p.x === 165 && p.y === 197 && p.size === 5));
  assert.deepEqual([byId('rack').flag, byId('rack').whenTrue, byId('rack').whenFalse], ['hasGauntlet', 'empty', 'full']);
  assert.deepEqual(byId('notebook').visibleIf, [{ notFlag: 'hasNotebook' }]);
  assert.deepEqual(room.foreground, [{ image: 'tent-stool', x: 96, y: 246, depth: 274 }]);
});

test('C7 kiln hall protects approved pixels and registers cold fires and hoist depth', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/kiln-hall-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../art/src/${file}`, import.meta.url))).digest('hex'), hash, file);
    assert.ok(isFinal(file), `${file} protected from generators`);
  }
  const room = CH1.rooms.maraRoom;
  const byId = (id: string) => room.objects.find(o => o.id === id)!;
  for (const [id, x] of [['fireA', 340], ['fireB', 402.5], ['fireC', 465]] as const) {
    const fire = byId(id);
    assert.deepEqual([fire.sheet, fire.x, fire.y, fire.flag, fire.whenTrue, fire.whenFalse], ['kiln-fire', x, 221, 'kilnCold', 'cold', 'lit']);
  }
  const swing = room.props!.find(p => p.kind === 'swing')!;
  assert.equal(swing.depth, 251);
  assert.ok(byId('hoist').depth! < swing.depth!);
  assert.ok(swing.depth! < room.walkable.outer[0].y);
  assert.deepEqual([byId('tent').x, byId('tent').y], [248, 264]);
  assert.deepEqual(room.hotspots.find(h => h.id === 'pulleys')!.outline, { objects: ['hoist'], props: ['pulley'] });
  for (const id of ['tally', 'jars', 'cart']) assert.deepEqual(room.hotspots.find(h => h.id === id)!.outline, { objects: [id] });
});

test('C7 firing house protects approved pixels, state flags and soup/fire/bubble registration', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/firing-house-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../art/src/${file}`, import.meta.url))).digest('hex'), hash, file);
    assert.ok(isFinal(file), `${file} protected from generators`);
  }
  const room = CH1.rooms.firingHouse;
  const object = (id: string) => room.objects.find(o => o.id === id)!;
  for (const [id, sheet, x, y, cold, warm] of [
    ['shoes', 'house-shoes', 112, 136, 'cold', 'warm'],
    ['fire', 'house-fire', 113, 251, 'cold', 'lit'],
    ['soup', 'house-soup', 115, 223, 'cold', 'warm'],
    ['pantryDoor', 'pantry-door', 334, 262, 'fixed', 'stuck'],
  ] as const) {
    const o = object(id);
    assert.deepEqual([o.sheet, o.x, o.y, o.flag, o.whenTrue, o.whenFalse], [sheet, x, y, id === 'pantryDoor' ? 'latchFixed' : 'kilnCold', cold, warm]);
  }
  assert.ok(object('fire').depth! < object('soup').depth!);
  const bubbles = room.props!.find(p => p.kind === 'bubbles')!;
  assert.deepEqual([bubbles.x, bubbles.y, bubbles.w, bubbles.h, bubbles.warm], [104, 199, 22, 2, true]);
  assert.ok(bubbles.y + 1 > object('soup').depth!);
  assert.ok(object('soup').depth! < room.walkable.outer[0].y);
  assert.deepEqual(room.hotspots.find(h => h.id === 'chalk')!.polygon, [{x:171,y:203},{x:189,y:203},{x:189,y:231},{x:171,y:231}]);
  for (const [target,id] of [['chalk','chalk'], ['sign','bell'], ['soup','soup'], ['shoes','shoes'], ['breadBasket','bread']]) {
    assert.deepEqual(room.hotspots.find(h => h.id === target)!.outline, { objects: [id] });
  }
});

test('C7 gallery protects approved pixels and registers the mirrored room, states and stairwell', () => {
  const approval = JSON.parse(readFileSync(new URL('../art/sources/gallery-c7/approval.json', import.meta.url), 'utf8'));
  for (const [file, hash] of Object.entries(approval.installedHashes)) {
    assert.equal(createHash('sha256').update(readFileSync(new URL(`../art/src/${file}`, import.meta.url))).digest('hex'), hash, file);
    assert.ok(isFinal(file), `${file} protected from generators`);
  }
  const room = CH1.rooms.gallery;
  const byId = (id: string) => room.objects.find(o => o.id === id)!;
  for (const [id, sheet] of [['regulator', 'gallery-regulator'], ['socket', 'socket'], ['railNames', 'gallery-names'], ['logbook', 'gallery-logbook'], ['lantern', 'gallery-lantern']] as const) {
    const spec = approval.registration[sheet];
    // Every sheet is placed by its bottom centre, whatever anchor the delivery recorded.
    assert.deepEqual([byId(id).sheet, byId(id).x, byId(id).y], [sheet, (spec.origin[0] + spec.canvas[0] / 2) / 2, (spec.origin[1] + spec.canvas[1]) / 2], id);
  }
  assert.deepEqual([byId('regulator').flag, byId('regulator').whenTrue, byId('regulator').whenFalse], ['patchFailed', 'ringCracked', 'cracked']);
  assert.deepEqual([byId('socket').flag, byId('socket').whenTrue, byId('socket').whenFalse], ['kilnCold', 'removed', 'installed']);
  assert.ok(byId('regulator').depth! < -9000, 'the body draws beneath the gauge face');
  const gauge = room.props!.find(p => p.kind === 'gauge')!;
  assert.deepEqual([gauge.x * 2, gauge.y * 2], approval.registration['gauge-face'].origin.map((v: number, i: number) => v + approval.registration['gauge-face'].centre[i]));
  // Ring centre art (800,376): the hatch is the removed socket's hollow (96 art px across).
  assert.deepEqual([room.hatch!.x, room.hatch!.y, room.hatch!.r], [400, 188, 24]);
  // The stairwell opening is not floor; the stairhead entry and walk-to stand clear of it.
  const [ox, oy, ow, oh] = approval.stairs.opening;
  const stairs = room.hotspots.find(h => h.id === 'galleryStairs')!;
  assert.deepEqual([stairs.walkTo, room.entries.fromFiringHouse], [{ x: 102, y: 286 }, { x: 102, y: 286, face: 'right' }]);
  assert.ok(stairs.walkTo!.x > ox + ow);
  assert.ok(room.walkable.outer.some(p => p.x > ox + ow && p.x < stairs.walkTo!.x && p.y > oy + oh), 'the walk area steps round the opening');
  for (const [target, ids] of [['regulator', ['regulator', 'socket']], ['railNames', ['railNames']], ['logbook', ['logbook']], ['lantern', ['lantern']]] as const) {
    assert.deepEqual(room.hotspots.find(h => h.id === target)!.outline!.objects, ids);
  }
});

test('art metadata registers unique files and every named character rig and portrait', () => {
  assert.equal(new Set(MANIFEST.map(entry => entry.id)).size, MANIFEST.length, 'manifest IDs are unique');
  assert.equal(new Set(MANIFEST.map(entry => entry.file)).size, MANIFEST.length, 'primary art files have one owner');
  for (const id of NPC_IDS) {
    const character = MANIFEST.find(entry => entry.kind === 'character' && entry.rig === id);
    assert.ok(character, `${id} has a character manifest entry`);
    assert.ok(RIGS[id], `${id} has rig settings`);
    assert.ok(character.sheet?.endsWith(`/${id}.json`), `${id} has animation metadata`);
    const portrait = MANIFEST.find(entry => entry.kind === 'portrait'
      && (entry.file.endsWith(`/portraits/${id}.png`) || entry.file === `portraits/${id}.png`));
    assert.ok(portrait, `${id} has a portrait manifest entry`);
    const rigMoods = RIGS[id].moods ?? ['neutral', 'worried', 'angry'];
    assert.deepEqual(portrait.moods, rigMoods, `${id} portrait and rig agree on expression frames`);
    if (PORTRAIT_MOODS[id]) assert.deepEqual(PORTRAIT_MOODS[id], portrait.moods, `${id} runtime portrait metadata agrees`);
  }
  for (const cfg of configs) {
    assert.equal(cfg.version, 1);
    assert.deepEqual(cfg.canvas, { width: 1024, height: 1536 });
    assert.equal(cfg.height, 232);
    assert.equal(cfg.walk.frames, 8);
  }
});

test('hierarchical joints meet and bone lengths stay fixed through the complete walk',()=>{
  for(const cfg of configs)for(let phase=0;phase<8;phase+=.25){
    const pose=walkPose(cfg,phase);
    for(const side of ['near','far']){
      const hip=cfg.joints[side+'Hip'],knee=cfg.joints[side+'Knee'],ankle=cfg.joints[side+'Ankle'];
      const h=point(pose.mats[side+'Thigh'],hip),k=point(pose.mats[side+'Thigh'],knee),a=point(pose.mats[side+'Shin'],ankle);
      assert.ok(Math.abs(distance(h,k)-distance(hip,knee))<1e-7);
      assert.ok(Math.abs(distance(k,a)-distance(knee,ankle))<1e-7);
      assert.ok(distance(k,point(pose.mats[side+'Shin'],knee))<1e-7,'knee continuity');
      assert.ok(distance(a,point(pose.mats[side+'Boot'],ankle))<1e-7,'ankle continuity');
      const elbow=cfg.joints[side+'Elbow'];
      const shoulder=cfg.joints[side+'Shoulder'];
      assert.ok(distance(point(pose.mats.torso,shoulder),point(pose.mats[side+'UpperArm'],shoulder))<1e-7,'shoulder continuity');
      assert.ok(distance(point(pose.mats[side+'UpperArm'],elbow),point(pose.mats[side+'Forearm'],elbow))<1e-7,'elbow continuity');
    }
  }
});

test('heel, flat-foot and toe contacts stay on their footprint while the actor moves forward',()=>{
  // Each contact point (heel, flat foot, toe) stays where it touched down, in world space, as the
  // actor travels forward by a quarter stride per frame.
  for(const cfg of configs)for(const [side,start] of [['near',0],['far',4]] as const){
    const first=new Map<string,number[]>();
    for(let phase=start;phase<start+4;phase+=.25){
      const foot=walkPose(cfg,phase).feet[side];assert.ok(foot.planted);
      const q=(phase+(side==='near'?0:4))%8;
      const world=[foot.contact[0]+q*cfg.walk.strideSource/4,foot.contact[1]],key=foot.contactSource.join();
      if(!first.has(key))first.set(key,world);
      assert.ok(distance(world,first.get(key)!)<1e-7,'a planted foot does not slide');
    }
  }
});

test('walk has restrained heel-to-toe roll, counter-sway and a heavier gauntlet arm',()=>{
  const rotation=(m:number[])=>Math.atan2(m[1],m[0]);
  for(const cfg of configs){
    // Enough toe-off roll to keep the landing knee nearly straight (art/layered-rig.mjs footMotion).
    assert.equal(cfg.walk.footRollDegrees,14);assert.equal(cfg.walk.transitionMs,90);
    const heel=walkPose(cfg,0),flat=walkPose(cfg,1.5),toe=walkPose(cfg,3.5);
    assert.ok(rotation(heel.mats.nearBoot)<0);assert.ok(Math.abs(rotation(flat.mats.nearBoot))<1e-7);assert.ok(rotation(toe.mats.nearBoot)>0);
    const a=walkPose(cfg,2),b=walkPose(cfg,6);
    assert.ok(rotation(a.mats.torso)<5*Math.PI/180);assert.ok(rotation(b.mats.torso)>5*Math.PI/180);
    if(cfg.outfit!=='casual'){
      let near=0,far=0;
      for(let p=0;p<8;p+=.125){const pose=walkPose(cfg,p),torso=rotation(pose.mats.torso);near=Math.max(near,Math.abs(rotation(pose.mats.nearUpperArm)-torso));far=Math.max(far,Math.abs(rotation(pose.mats.farUpperArm)-torso));}
      assert.ok(near<far*.75,'heavy arm has less swing');
    }
    for(let p=0;p<8;p+=.125){
      const a=walkPose(cfg,p),b=walkPose(cfg,p+1e-5);
      for(const side of ['near','far'])assert.ok(distance(a.feet[side].ankle,b.feet[side].ankle)<.1,'foot targets are continuous through lift and contact');
    }
  }
});

test('eight-frame timing lands on 0/4 and legacy sheets keep six-frame 7px timing',()=>{
  assert.deepEqual(walkTiming(),LEGACY_WALK);
  for(const cfg of configs){
    const timing=walkTiming(walkMetadata(cfg));assert.deepEqual(timing.plantFrames,[0,4]);
    assert.deepEqual(Array.from({length:9},(_,i)=>walkFrameAt((i+.001)*timing.distancePerFrame,8,timing)),[0,1,2,3,4,5,6,7,0]);
  }
  assert.deepEqual(Array.from({length:7},(_,i)=>walkFrameAt(i*7,6,LEGACY_WALK)),[0,1,2,3,4,5,0]);
});

test('outfit equipment and gauntlet power are independent across chapters',()=>{
  const state=newGame(),ch1=CH1,ctx={state,room:ch1.rooms[state.room],cold:false};
  state.kit.owned.push('layered-armor','light-armor');
  assert.ok(equip(state.kit,'armor','layered-armor'));
  assert.equal(heroSheetFor(ch1.story,ctx),'mara-casual');
  const unpoweredStory={...ch1.story,heroSheet:[{pick:'mara'}]};
  assert.equal(heroSheetFor(unpoweredStory,ctx),'mara-medium');
  state.flags.hasGauntlet=true;assert.equal(heroSheetFor(ch1.story,ctx),'mara-medium-gauntlet');
  for(const armor of ['patched-coat','light-armor']){
    assert.ok(equip(state.kit,'armor',armor));assert.equal(heroSheetFor(ch1.story,ctx),'mara-gauntlet');
    state.flags.hasGauntlet=false;assert.equal(heroSheetFor(unpoweredStory,ctx),'mara');state.flags.hasGauntlet=true;
  }
  assert.ok(equip(state.kit,'armor','layered-armor'));
  assert.equal(heroSheetFor(CH2_STORY,{state,room:CH2_ROOMS[CH2_START_ROOM],cold:false}),'mara-medium-gauntlet');
});
