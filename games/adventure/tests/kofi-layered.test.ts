import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { PARTS, loadPack, compositeNeutral, renderPackFrame, walkPose, point } from '../art/layered-rig.mjs';
import { paletteConformity } from '../art/normalize.mjs';

const packs = ['village', 'travel'].map(outfit => loadPack(`art/sources/characters/kofi-${outfit}-layered`));
const distance = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('Kofi uses eleven registered body pieces, including separate complete forearm/hand layers', () => {
  for (const pack of packs) {
    assert.deepEqual(pack.cfg.order, PARTS);
    assert.deepEqual(compositeNeutral(pack).data, pack.master.data);
    for (const name of PARTS) {
      const png = pack.layers[name];
      assert.deepEqual([png.width, png.height], [1024, 1536]);
      assert.ok(png.data.some((value, i) => i % 4 === 3 && value === 255), `${name} contains artwork`);
      for (let p = 3; p < png.data.length; p += 4) assert.ok(png.data[p] === 0 || png.data[p] === 255);
    }
    for (const side of ['near', 'far']) {
      const forearm = pack.layers[side + 'Forearm'];
      const elbow = pack.cfg.joints[side + 'Elbow'];
      let below = 0;
      for (let y = elbow[1] + 150; y < 920; y++) for (let x = 280; x < 720; x++) if (forearm.data[(y * 1024 + x) * 4 + 3]) below++;
      assert.ok(below > 500, `${side} forearm includes the wrist and full hand`);
    }
  }
});

test('Kofi keeps the keyed source master unchanged beneath the articulated construction', () => {
  const original = PNG.sync.read(readFileSync('art/sources/characters/kofi-layered-originals/master-profile.png'));
  for (let p = 0; p < original.data.length; p += 4) {
    const [r, g, b, a] = original.data.subarray(p, p + 4);
    if (a < 128 || (r > g * 1.5 + 20 && b > g * 1.5 + 15)) original.data.fill(0, p, p + 4);
    else original.data[p + 3] = 255;
  }
  assert.deepEqual(packs[0].master.data, original.data, 'segmentation preserves the original face, body and outfit pixels');
});

test('Kofi elbows bend independently while every arm and leg joint stays connected', () => {
  for (const pack of packs) for (let phase = 0; phase < 8; phase += .25) {
    const pose = walkPose(pack.cfg, phase);
    for (const side of ['near', 'far']) {
      const shoulder = pack.cfg.joints[side + 'Shoulder'], elbow = pack.cfg.joints[side + 'Elbow'];
      const upper = pose.mats[side + 'UpperArm'], forearm = pose.mats[side + 'Forearm'];
      assert.ok(distance(point(upper, elbow), point(forearm, elbow)) < 1e-6, 'elbow attachment');
      assert.ok(Math.abs(distance(point(upper, shoulder), point(upper, elbow)) - distance(shoulder, elbow)) < 1e-6, 'fixed upper-arm length');
      assert.ok(Math.abs(Math.atan2(forearm[1], forearm[0]) - Math.atan2(upper[1], upper[0])) > .05, 'forearm has its own elbow rotation');
      const hip = pack.cfg.joints[side + 'Hip'], knee = pack.cfg.joints[side + 'Knee'], ankle = pack.cfg.joints[side + 'Ankle'];
      const h = point(pose.mats[side + 'Thigh'], hip), k = point(pose.mats[side + 'Thigh'], knee), a = point(pose.mats[side + 'Shin'], ankle);
      assert.ok(Math.abs(distance(h, k) - distance(hip, knee)) < 1e-6);
      assert.ok(Math.abs(distance(k, a) - distance(knee, ankle)) < 1e-6);
      assert.ok(distance(k, point(pose.mats[side + 'Shin'], knee)) < 1e-6, 'knee attachment');
    }
  }
});

test('Kofi travel rig changes only the gear-bearing pieces and uses the same body joints', () => {
  const [village, travel] = packs;
  assert.deepEqual(travel.cfg.joints, village.cfg.joints);
  assert.deepEqual(travel.cfg.walk, village.cfg.walk);
  const cfg = JSON.parse(readFileSync('art/sources/characters/kofi-travel-layered/rig.json', 'utf8'));
  assert.equal(cfg.attachments.bow.parent, 'nearThigh');
  assert.equal(cfg.attachments.quiver.parent, 'torso');
  for (const name of PARTS) {
    if (name === 'torso' || name === 'nearThigh') assert.notDeepEqual(travel.layers[name].data, village.layers[name].data);
    else assert.deepEqual(travel.layers[name].data, village.layers[name].data, `${name} is shared anatomy`);
  }
});

test('actual Kofi rig renders bounded palette frames with covered joints through its walk', () => {
  for (const pack of packs) for (let phase = 0; phase < 8; phase++) {
    const frame = renderPackFrame(pack, { phase });
    assert.equal(paletteConformity(frame.data), 1);
    for (let p = 3; p < frame.data.length; p += 4) assert.ok(frame.data[p] === 0 || frame.data[p] === 255);
    for (let y = 0; y < 256; y++) assert.equal(frame.data[(y * 256) * 4 + 3] + frame.data[(y * 256 + 255) * 4 + 3], 0);
    const pose = walkPose(pack.cfg, phase), scale = (pack.cfg.height - 4) / pack.cfg.sourceHeight;
    const hipX = (pack.cfg.joints.nearHip[0] + pack.cfg.joints.farHip[0]) / 2;
    for (const side of ['near', 'far']) for (const [joint, part] of [['Shoulder', 'UpperArm'], ['Elbow', 'Forearm'], ['Knee', 'Shin'], ['Ankle', 'Boot']]) {
      const p = point(pose.mats[side + part], pack.cfg.joints[side + joint]);
      const x = Math.floor(128 + (p[0] - hipX) * scale), y = Math.floor(252 + (p[1] - pack.cfg.baseline) * scale);
      let covered = false;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (x + dx >= 0 && x + dx < 256 && y + dy >= 0 && y + dy < 256 && frame.data[((y + dy) * 256 + x + dx) * 4 + 3]) covered = true;
      }
      assert.ok(covered, `phase ${phase}: ${side}${joint} has no transparent joint gap`);
    }
  }
});
