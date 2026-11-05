// Checks every art file the game loads against what the code expects: sizes, frame layouts,
// animation tags, portrait strips, icons. Run after replacing any image:
//
//   npm run art:check
//
// See art/REPLACING.md (npm run art:guide) for what each file must contain.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { PNG } from 'pngjs';
import { MANIFEST, RIGS } from '../art/manifest.mjs';
import { paletteConformity } from '../art/normalize.mjs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PORTRAIT_MOODS, ROOM_FILES } from '../src/content/art';
import { EXTRAS } from '../src/chapters/ch1/crowd';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { ITEMS } from '../src/chapters/ch1/flags';
import { NPC_IDS, VERBS } from '../src/engine/types';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const ART = join(root, 'art', 'src');

export const ROOM_SIZE = { w: 1280, h: 720 };
export const FRAME = 256;
export const ITEM_SIZE = 64;
export const ICON_SIZE = 24;

/** Animation tags each kind of character sheet must have (see src/game/Actor.ts and src/game/Crowd.ts). */
export const STORY_TAGS = ['stand_down', 'blink_down', 'stand_side', 'blink_side', 'stand_up', 'walk_down', 'walk_side', 'walk_up', 'crouch', 'dead'];
export const EXTRA_TAGS = ['stand_down', 'stand_side', 'stand_up', 'blink_down', 'blink_side', 'walk_down', 'walk_side', 'walk_up', 'crouch', 'work', 'carry', 'reach', 'sit'];
/** Character sheets: Mara (unlit and lit gauntlet), the story characters, then the background people. */
/** `dir`: a later chapter's characters live in its folder (art/src/<chapter>/characters). */
export const CHARACTER_SHEETS: { sheet: string; role: string; tags: string[]; optional?: string[]; dir?: string }[] = [
  { sheet: 'mara-casual', role: 'Mara in casual clothes', tags: STORY_TAGS },
  { sheet: 'mara-medium', role: 'Mara in medium armour, unlit', tags: STORY_TAGS },
  { sheet: 'mara-medium-gauntlet', role: 'Mara in medium armour, lit', tags: STORY_TAGS },
  { sheet: 'mara', role: 'Mara, gauntlet unlit (start of the game)', tags: STORY_TAGS },
  { sheet: 'mara-gauntlet', role: 'Mara, gauntlet lit', tags: STORY_TAGS },
  ...NPC_IDS.map(id => ({ sheet: id, role: `${id[0].toUpperCase()}${id.slice(1)} (story character)`, tags: STORY_TAGS, optional: ['fidget'], dir: (RIGS as Record<string, { dir?: string }>)[id]?.dir })),
  ...EXTRAS.map(e => ({ sheet: e.sheet, role: `background person (${e.id.replace('extra-', '')})`, tags: EXTRA_TAGS })),
];
/** Sheets the game ships as WebP copies (the PNG is the source; `npm run webp` writes the copy). */
export const WEBP_SHEETS: string[] = EXTRAS.map(e => e.sheet);
/** Enemies in fights (art/src/battle). */
export const BATTLE_SPRITES = ['scavenger'];

export interface Problem { file: string; message: string; warning?: boolean }

/** Width and height from a PNG's header (no decoding). */
export function pngSize(path: string): { w: number; h: number } {
  const b = readFileSync(path);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

interface Sheet {
  frames: { filename: string; frame: { x: number; y: number; w: number; h: number }; duration: number }[];
  meta: { size?: { w: number; h: number }; frameTags: { name: string; from: number; to: number }[] };
}

export function checkArt(): Problem[] {
  const problems: Problem[] = [];
  const rel = (p: string) => relative(root, p).replaceAll('\\', '/');
  const fail = (file: string, message: string) => problems.push({ file: rel(file), message });
  const warn = (file: string, message: string) => problems.push({ file: rel(file), message, warning: true });
  const needPng = (file: string): { w: number; h: number } | null => {
    if (!existsSync(file)) { fail(file, 'missing'); return null; }
    try { return pngSize(file); } catch { fail(file, 'not a PNG'); return null; }
  };
  const webpFor = (png: string) => {
    const webp = png.replace(/\.png$/, '.webp');
    if (!existsSync(webp)) fail(webp, 'missing WebP copy: run npm run webp');
    else if (statSync(webp).mtimeMs + 1000 < statSync(png).mtimeMs) warn(webp, 'older than its PNG: run npm run webp');
  };
  const sheet = (base: string, tags: string[], frameSize?: number): Sheet | null => {
    const png = needPng(`${base}.png`);
    const jsonPath = `${base}.json`;
    if (!existsSync(jsonPath)) { fail(jsonPath, 'missing'); return null; }
    let json: Sheet;
    try { json = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch { fail(jsonPath, 'not valid JSON'); return null; }
    if (!Array.isArray(json.frames) || !json.meta?.frameTags) { fail(jsonPath, 'not an Aseprite JSON-array sheet (frames[] and meta.frameTags)'); return null; }
    if (png && json.meta.size && (json.meta.size.w !== png.w || json.meta.size.h !== png.h)) {
      fail(jsonPath, `meta.size is ${json.meta.size.w}x${json.meta.size.h} but the PNG is ${png.w}x${png.h}`);
    }
    json.frames.forEach((f, i) => {
      const r = f.frame;
      if (png && (r.x < 0 || r.y < 0 || r.x + r.w > png.w || r.y + r.h > png.h)) fail(jsonPath, `frame ${i} lies outside the image`);
      if (frameSize && (r.w !== frameSize || r.h !== frameSize)) fail(jsonPath, `frame ${i} is ${r.w}x${r.h}, expected ${frameSize}x${frameSize}`);
      if (!(f.duration > 0)) fail(jsonPath, `frame ${i} has no duration`);
    });
    for (const t of json.meta.frameTags) {
      if (t.from < 0 || t.to < t.from || t.to >= json.frames.length) fail(jsonPath, `tag ${t.name} points at missing frames (${t.from}-${t.to})`);
    }
    const have = new Set(json.meta.frameTags.map(t => t.name));
    for (const tag of tags) if (!have.has(tag)) fail(jsonPath, `missing tag "${tag}"`);
    return json;
  };

  // Rooms: 1280x720 paintings, shipped as WebP.
  for (const room of Object.values(ROOMS)) {
    const name = ROOM_FILES[room.background];
    if (!name) { fail(join(ART, 'rooms'), `no file name known for ${room.background} (update ROOM_FILES)`); continue; }
    const png = join(ART, 'rooms', `${name}.png`);
    const size = needPng(png);
    if (size && (size.w !== ROOM_SIZE.w || size.h !== ROOM_SIZE.h)) fail(png, `is ${size.w}x${size.h}, expected ${ROOM_SIZE.w}x${ROOM_SIZE.h}`);
    if (size) webpFor(png);
    for (const f of room.foreground ?? []) {
      const fg = join(ART, 'foreground', `${f.image}.png`);
      const s = needPng(fg);
      if (s) {
        webpFor(fg);
        if (f.x * 2 + s.w > ROOM_SIZE.w + 2 || f.y * 2 + s.h > ROOM_SIZE.h + 2) fail(fg, `placed at world (${f.x}, ${f.y}) it runs off the room (${s.w}x${s.h})`);
      }
    }
    for (const p of room.props ?? []) {
      if (!('image' in p)) continue;
      const prop = join(ART, 'props', `${p.image}.png`);
      if (needPng(prop)) webpFor(prop);
    }
    // Hover outlines: every hotspot painted into the room (no object of its own) has one cut from the
    // painting (npm run art:outlines; the game traces the click area if not).
    const outlines = join(ART, 'outlines', `${room.background}.json`);
    const place: Record<string, unknown> = existsSync(outlines) ? JSON.parse(readFileSync(outlines, 'utf8')).place ?? {} : {};
    const objects = new Set((room.objects ?? []).map(o => o.id));
    for (const h of room.hotspots) {
      const painted = h.outline?.painted ?? !(h.outline?.objects?.length || objects.has(h.id));
      if (painted && !place[h.id]) warn(outlines, `no hover outline for ${room.id}'s "${h.id}" (run npm run art:outlines)`);
    }
    for (const o of room.objects) {
      const tags = [o.whenTrue, o.whenFalse, o.anim].filter((x): x is string => !!x);
      sheet(join(ART, 'objects', o.sheet), tags);
    }
  }

  // Characters: 256x256 frames, feet on the bottom row, centred.
  for (const c of CHARACTER_SHEETS) {
    const json = sheet(join(ART, `${c.dir ?? ''}characters`, c.sheet), c.tags, FRAME);
    if (json && WEBP_SHEETS.includes(c.sheet)) webpFor(join(ART, 'characters', `${c.sheet}.png`));
  }

  // Portraits: one 256x256 frame per mood and mouth state, side by side.
  for (const [who, moods] of Object.entries(PORTRAIT_MOODS)) {
    const file = join(ART, 'portraits', `${who}.png`);
    const s = needPng(file);
    if (s && (s.w !== FRAME * moods.length * 2 || s.h !== FRAME)) {
      fail(file, `is ${s.w}x${s.h}, expected ${FRAME * moods.length * 2}x${FRAME} (${moods.join(', ')}; mouth closed then open)`);
    }
  }

  // Battle sprites: standing on their bottom edge, facing the viewer or Mara (the game mirrors them).
  for (const name of BATTLE_SPRITES) {
    const file = join(ART, 'battle', `${name}.png`);
    const s = needPng(file);
    if (s && (s.w > 640 || s.h > 600)) warn(file, `is ${s.w}x${s.h}; battle sprites are about 300 px wide`);
  }

  // Satchel items and action-ring icons.
  for (const item of ITEMS) {
    const file = join(ART, 'items', `${item}.png`);
    const s = needPng(file);
    if (s && (s.w !== ITEM_SIZE || s.h !== ITEM_SIZE)) fail(file, `is ${s.w}x${s.h}, expected ${ITEM_SIZE}x${ITEM_SIZE}`);
  }
  for (const verb of VERBS) {
    const file = join(ART, 'icons', `${verb}.png`);
    const s = needPng(file);
    if (s && (s.w !== ICON_SIZE || s.h !== ICON_SIZE)) warn(file, `is ${s.w}x${s.h}; the ring shows icons at ${ICON_SIZE}x${ICON_SIZE} CSS pixels (a larger square is fine)`);
  }
  problems.push(...checkManifest());
  return problems;
}

/**
 * The art manifest against the files: every listed image exists (unless only requested), every
 * file under art/src is listed, and every final (Codex) image keeps to the master palette.
 */
export function checkManifest(): Problem[] {
  const problems: Problem[] = [];
  const listed = new Set<string>();
  for (const e of MANIFEST) {
    for (const f of [e.file, e.sheet, e.webp ? e.file.replace(/\.png$/, '.webp') : undefined]) if (f) listed.add(f);
    if (e.status === 'requested') continue;
    const path = join(ART, e.file);
    if (!existsSync(path)) { problems.push({ file: `art/src/${e.file}`, message: `listed in the manifest (${e.id}) but missing` }); continue; }
    if (e.status === 'final' && e.file.endsWith('.png')) {
      const png = PNG.sync.read(readFileSync(path));
      const share = paletteConformity(png.data);
      if (share < 0.999) problems.push({ file: `art/src/${e.file}`, message: `final art off the master palette (${(share * 100).toFixed(1)}% conforming): re-import it` });
      if (e.size && (png.width !== e.size.w || png.height !== e.size.h)) problems.push({ file: `art/src/${e.file}`, message: `final art is ${png.width}x${png.height}, the manifest says ${e.size.w}x${e.size.h}` });
    }
  }
  const walk = (dir: string): string[] => readdirSync(join(ART, dir), { withFileTypes: true })
    .flatMap(d => (d.isDirectory() ? walk(`${dir}${d.name}/`) : [`${dir}${d.name}`]));
  // Hover outline sheets are generated from the room paintings (npm run art:outlines), checked with the rooms.
  for (const f of walk('')) if (!listed.has(f) && !f.startsWith('outlines/')) problems.push({ file: `art/src/${f}`, message: 'not in the art manifest (art/manifest.mjs)' });
  return problems;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const problems = checkArt();
  const errors = problems.filter(p => !p.warning);
  for (const p of problems) console.log(`${p.warning ? 'warning' : 'ERROR  '} ${p.file}: ${p.message}`);
  console.log(errors.length ? `\n${errors.length} problem(s). See art/REPLACING.md.` : 'All art files match what the game expects.');
  process.exit(errors.length ? 1 : 0);
}
