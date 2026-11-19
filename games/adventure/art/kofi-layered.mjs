// Kofi's registered source pieces. Uses the same eleven-piece renderer as Silas.
// Writes only Kofi's source packs and local review assets; never installs runtime artwork.
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PNG } from 'pngjs';
import { PARTS, loadPack, compositeNeutral, renderPackFrame, walkPose, walkMetadata, point } from './layered-rig.mjs';
import { paletteConformity } from './normalize.mjs';
const art = fileURLToPath(new URL('./', import.meta.url));
const originals = `${art}sources/characters/kofi-layered-originals/`;
const review = `${art}inbox/kofi-layered/review/`;
await fs.mkdir(review, { recursive: true });
const W = 1024, H = 1536;
const blank = () => new PNG({ width: W, height: H });
const at = (x, y) => (y * W + x) * 4;
function keyed(file) {
  const png = PNG.sync.read(readFileSync(file));
  if (png.width !== W || png.height !== H) throw new Error(`Source dimensions: ${file}`);
  for (let k = 0; k < png.data.length; k += 4) {
    const [r, g, b, a] = png.data.subarray(k, k + 4);
    if (a < 128 || (r > g * 1.5 + 20 && b > g * 1.5 + 15)) png.data.fill(0, k, k + 4);
    else png.data[k + 3] = 255;
  }
  return png;
}
function inside(x, y, points) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const master = keyed(`${originals}master-profile.png`);
const torsoUnder = keyed(`${originals}torso-underpainting.png`);
const joints = {
  nearShoulder: [395, 438], nearElbow: [359, 570], farShoulder: [550, 430], farElbow: [604, 655],
  nearHip: [435, 805], farHip: [545, 805], nearKnee: [400, 1050], farKnee: [545, 1050],
  nearAnkle: [335, 1355], farAnkle: [565, 1345],
};
const masks = {
  farUpperArm: [[564, 565], [601, 578], [625, 635], [619, 666], [582, 670], [571, 620]],
  farForearm: [[584, 632], [621, 629], [641, 676], [653, 724], [655, 757], [678, 784], [685, 834], [669, 877], [645, 902], [611, 895], [604, 855], [608, 801], [599, 765], [588, 710]],
  nearUpperArm: [[340, 411], [390, 401], [432, 421], [450, 458], [426, 512], [419, 552], [405, 582], [355, 595], [326, 564], [323, 501]],
  nearForearm: [[340, 549], [400, 544], [421, 580], [438, 633], [447, 677], [450, 716], [439, 748], [457, 773], [480, 811], [495, 858], [481, 891], [454, 910], [405, 901], [369, 882], [349, 839], [346, 792], [353, 755], [356, 710], [341, 650], [328, 605]],
};
const owner = new Uint8Array(W * H).fill(PARTS.indexOf('torso'));
// Split hide wrap and legs along the original crotch; arms retain ownership where they overlap.
function seam(y) {
  if (y < 950) return 488;
  if (y < 1050) return 488 - (y - 950) * .27;
  return 461 + Math.min(36, (y - 1050) * .09);
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  let name = 'torso';
  if (y >= 805) {
    const side = x < seam(y) ? 'near' : 'far';
    name = side + (y < 1050 ? 'Thigh' : y < 1340 ? 'Shin' : 'Boot');
  }
  for (const [part, points] of Object.entries(masks)) {
    // The far upper arm is completely concealed by the body in the reference. Its exposed
    // moving surface is supplied by the generated arm, not borrowed belt/bell pixels.
    if (part === 'farUpperArm' || (part === 'farForearm' && y < 731)) continue;
    if (inside(x, y, points)) name = part;
  }
  // The goat-bell and its hanger belong to the belt, not the partially concealed far arm.
  if (inside(x, y, [[579, 633], [610, 638], [637, 682], [643, 719], [625, 733], [587, 727], [579, 689]])) name = 'torso';
  owner[y * W + x] = PARTS.indexOf(name);
}
const caps = {
  farUpperArm: [['farShoulder', 42], ['farElbow', 34]], farForearm: [['farElbow', 34]],
  nearUpperArm: [['nearShoulder', 35], ['nearElbow', 36]], nearForearm: [['nearElbow', 36]],
  farThigh: [['farHip', 55], ['farKnee', 43]], farShin: [['farKnee', 43], ['farAnkle', 40]], farBoot: [['farAnkle', 40]],
  nearThigh: [['nearHip', 55], ['nearKnee', 43]], nearShin: [['nearKnee', 43], ['nearAnkle', 40]], nearBoot: [['nearAnkle', 40]],
  torso: [['nearHip', 55], ['farHip', 55]],
};
const layers = Object.fromEntries(PARTS.map(name => [name, blank()]));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const k = at(x, y);
  if (!master.data[k + 3]) continue;
  for (const name of PARTS) {
    const main = owner[y * W + x] === PARTS.indexOf(name);
    const cap = caps[name].some(([joint, radius]) => Math.hypot(x - joints[joint][0], y - joints[joint][1]) <= radius);
    if (main || cap) master.data.copy(layers[name].data, k, k, k + 4);
  }
}
// Paint only concealed torso/wrap pixels. Original near-arm pixels cover them in neutral pose.
// Filling the garment beneath the hand also keeps the thigh continuous around its hip pivot.
for (let y = 390; y < 1050; y++) for (let x = 335; x < 625; x++) {
  const k = at(x, y);
  if (master.data[k + 3] && torsoUnder.data[k + 3] && owner[y * W + x] > PARTS.indexOf('torso')) {
    const bodyName = y < 805 ? 'torso' : (x < seam(y) ? 'nearThigh' : 'farThigh');
    torsoUnder.data.copy(layers[bodyName].data, k, k, k + 4);
    // Any cap that borrowed original arm pixels must use the same concealed body material.
    for (const name of ['torso', 'nearThigh', 'farThigh']) if (layers[name].data[k + 3]) torsoUnder.data.copy(layers[name].data, k, k, k + 4);
  }
}
async function placed(source, box) {
  const clean = typeof source === 'string' ? keyed(source) : source;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (clean.data[at(x, y) + 3]) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  const [left, top, right, bottom] = box;
  const cut = await sharp(PNG.sync.write(clean)).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(right - left, bottom - top, { kernel: 'nearest' }).png().toBuffer();
  const result = PNG.sync.read(await sharp({ create: { width: W, height: H, channels: 4, background: '#0000' } })
    .composite([{ input: cut, left, top }]).png().toBuffer());
  for (let k = 0; k < result.data.length; k += 4) {
    if (result.data[k + 3] < 128) result.data.fill(0, k, k + 4);
    else result.data[k + 3] = 255;
  }
  return result;
}
const hiddenArm = await placed(`${originals}far-arm-underpainting.png`, [507, 389, 669, 901]);
layers.farUpperArm.data.fill(0);
for (let y = 0; y < 731; y++) layers.farForearm.data.fill(0, y * W * 4, (y + 1) * W * 4);
for (let y = 389; y < 731; y++) for (let x = 507; x < 669; x++) {
  const k = at(x, y);
  if (master.data[k + 3] && hiddenArm.data[k + 3] && owner[y * W + x] > 1) {
    if (y < 700) hiddenArm.data.copy(layers.farUpperArm.data, k, k, k + 4);
    if (y > 620) hiddenArm.data.copy(layers.farForearm.data, k, k, k + 4);
  }
}
const cfg = {
  version: 1, outfit: 'casual', canvas: { width: W, height: H }, height: 232, baseline: 1493, sourceHeight: 1442,
  overlap: 25, order: PARTS, joints,
  eyes: [{ x: 558, y: 138, rx: 8, ry: 3, skinAt: [553, 149], blinkRy: 7, lashTop: -1, lashBottom: 5 }],
  face: { mouth: { x: 581, y: 194, rx: 9, ry: 3 }, brows: [{ x0: 535, x1: 568, y0: 117, y1: 128, inner: 'right' }] },
  portrait: [360, 45, 300, 300], ember: null,
  walk: { frames: 8, contactFrames: [0, 4], hipSwing: 16, armSwing: 18, lift: 45, strideSource: 320,
    torsoLeanDegrees: 2, widthScale: 1, footRollDegrees: 12, hipSwayDegrees: 1, torsoSwayDegrees: .7, weightDrop: 4, transitionMs: 90,
    footCentre: -40, liftEarly: .5,
    soles: { near: { heel: [280, 1492], toe: [476, 1492] }, far: { heel: [529, 1475], toe: [748, 1475] } },
    calibration: 'Kofi: grounded practical gait, restrained arm swing, low foot clearance; source anatomy and joint lengths remain fixed. Both forearms include the complete hands and pivot at the elbow.' },
};
if (!compositeNeutral({ cfg, layers }).data.equals(master.data)) throw new Error('Village layers do not reproduce original master');
const bow = await placed(`${originals}folded-bow.png`, [295, 702, 368, 1042]);
const travelReference = PNG.sync.read(readFileSync(`${originals}travel-reference.png`));
const quiverCut = blank();
const quiverPolygon = [[260, 308], [261, 287], [267, 284], [268, 252], [264, 238], [271, 231], [282, 242], [292, 229], [306, 226], [316, 251], [327, 290], [314, 309], [297, 326], [285, 482], [269, 485], [260, 420]];
for (let y = 220; y < 490; y++) for (let x = 250; x < 332; x++) if (inside(x, y, quiverPolygon)) travelReference.data.copy(quiverCut.data, at(x, y), at(x, y), at(x, y) + 4);
const quiver = await placed(quiverCut, [287, 220, 365, 590]);
function over(bottom, top) {
  const out = { ...bottom, data: Buffer.from(bottom.data) };
  for (let k = 0; k < top.data.length; k += 4) if (top.data[k + 3]) top.data.copy(out.data, k, k, k + 4);
  return out;
}
const reports = [];
for (const outfit of ['village', 'travel']) {
  const dir = `${art}sources/characters/kofi-${outfit}-layered/`;
  await fs.mkdir(dir, { recursive: true });
  const own = Object.fromEntries(PARTS.map(name => [name, { ...layers[name], data: Buffer.from(layers[name].data) }]));
  const ownCfg = structuredClone(cfg);
  if (outfit === 'travel') {
    own.nearThigh = over(own.nearThigh, bow);
    own.torso = over(quiver, own.torso);
    ownCfg.attachments = { bow: { file: 'bow.png', parent: 'nearThigh', note: 'Rigid; follows thigh rotation, never bent at the knee.' },
      quiver: { file: 'quiver.png', parent: 'torso', note: 'Rigid against back; no independent pendulum swing.' } };
    await fs.writeFile(`${dir}bow.png`, PNG.sync.write(bow));
    await fs.writeFile(`${dir}quiver.png`, PNG.sync.write(quiver));
  }
  const combined = compositeNeutral({ cfg: ownCfg, layers: own });
  await fs.writeFile(`${dir}master.png`, PNG.sync.write(combined));
  await fs.writeFile(`${dir}rig.json`, JSON.stringify(ownCfg, null, 2) + '\n');
  for (const name of PARTS) await fs.writeFile(`${dir}${name}.png`, PNG.sync.write(own[name]));
  const legend = JSON.parse(readFileSync(`${art}sources/characters/mara-casual-layered/joint-colours.json`, 'utf8'));
  await fs.writeFile(`${dir}joint-colours.json`, JSON.stringify(legend, null, 2) + '\n');
  await fs.writeFile(`${dir}joint-positions.json`, JSON.stringify({ canvas: [W, H], order: PARTS, joints }, null, 2) + '\n');
  const dots = `<svg width="${W}" height="${H}">${legend.joints.map(item => `<circle cx="${joints[item.name][0]}" cy="${joints[item.name][1]}" r="7" fill="${item.colour}" stroke="black" stroke-width="2"/>`).join('')}</svg>`;
  await sharp(PNG.sync.write(combined)).composite([{ input: Buffer.from(dots) }]).png().toFile(`${dir}joints.png`);
  const pack = loadPack(dir);
  const frames = Array.from({ length: 8 }, (_, phase) => renderPackFrame(pack, { phase }));
  const pngs = frames.map(frame => PNG.sync.write(frame));
  await sharp({ create: { width: 1024, height: 512, channels: 4, background: '#30261f' } })
    .composite(pngs.map((input, i) => ({ input, left: i % 4 * 256, top: Math.floor(i / 4) * 256 })))
    .png().toFile(`${review}${outfit}-frames.png`);
  const stack = await sharp({ create: { width: 256, height: 2048, channels: 4, background: '#30261f' } })
    .composite(pngs.map((input, i) => ({ input, left: 0, top: i * 256 }))).raw().toBuffer();
  await sharp(stack, { raw: { width: 256, height: 2048, channels: 4, pageHeight: 256 } })
    .gif({ delay: Array(8).fill(100), loop: 0 }).toFile(`${review}kofi-${outfit}-layered-walk.gif`);
  const layerTiles = [];
  for (let i = 0; i < PARTS.length; i++) {
    const tile = await sharp(PNG.sync.write(own[PARTS[i]])).resize(256, 384, { kernel: 'nearest' }).png().toBuffer();
    const label = Buffer.from(`<svg width="256" height="384"><text x="8" y="18" fill="white" font-size="14">${PARTS[i]}</text></svg>`);
    const labelled = await sharp(tile).composite([{ input: label }]).png().toBuffer();
    layerTiles.push({ input: labelled, left: i % 4 * 256, top: Math.floor(i / 4) * 384 });
  }
  await sharp({ create: { width: 1024, height: 1152, channels: 4, background: '#30261f' } }).composite(layerTiles).png().toFile(`${review}${outfit}-layers.png`);
  const maxDrift = { arm: 0, leg: 0 };
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  for (let phase = 0; phase < 8; phase += .25) {
    const pose = walkPose(ownCfg, phase);
    for (const side of ['near', 'far']) {
      const a = point(pose.mats[side + 'UpperArm'], joints[side + 'Elbow']);
      const b = point(pose.mats[side + 'Forearm'], joints[side + 'Elbow']);
      maxDrift.arm = Math.max(maxDrift.arm, distance(a, b));
      maxDrift.leg = Math.max(maxDrift.leg, distance(point(pose.mats[side + 'Thigh'], joints[side + 'Knee']), point(pose.mats[side + 'Shin'], joints[side + 'Knee'])));
    }
  }
  reports.push({ outfit, layerCount: PARTS.length, exactNeutralReconstruction: true, sharedCanvas: [W, H],
    allFramesOnPalette: frames.every(p => paletteConformity(p.data) === 1), maxJointDrift: maxDrift, walk: walkMetadata(ownCfg), attachments: ownCfg.attachments ?? {} });
  console.log(`${outfit}: eleven pieces; exact master reconstruction; independent elbow rotation; rendered eight-frame IK walk.`);
}
await fs.writeFile(`${review}validation.json`, JSON.stringify(reports, null, 2) + '\n');
