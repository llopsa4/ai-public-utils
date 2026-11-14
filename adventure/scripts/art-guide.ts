// Writes art/REPLACING.md (what every art file must contain, generated from the game's data) and
// art/spec/<room>.jpg (each room with its clickable areas, walk area and anchor points drawn on).
// Re-run after changing rooms or sheets:
//
//   npm run art:guide
import { writeWorldMapSpec } from './world-map-spec';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeReferences } from './art-reference';
import sharp from 'sharp';
import { CROWDS } from '../src/chapters/ch1/crowd';
import { loadAllChapters } from '../src/chapters';
import { MANIFEST } from '../art/manifest.mjs';
import { TABLES } from '../src/engine/i18n';
import { ITEMS } from '../src/chapters/ch1/flags';
import type { Point, RoomDef } from '../src/engine/types';
import { VERBS } from '../src/engine/types';
import { PORTRAIT_MOODS, ROOM_FILES } from '../src/content/art';
import { ART, CHARACTER_SHEETS, FRAME, ICON_SIZE, ITEM_SIZE, ROOM_SIZE, WEBP_SHEETS, pngSize } from './art-check';

/** A room painting's file under art/src, without the extension (from the art manifest). */
const roomFile = (background: string) => (MANIFEST.find(e => e.id === background)?.file ?? `rooms/${ROOM_FILES[background]}.png`).replace(/\.png$/, '');
const K = 2; // art pixels per world unit
const art = (n: number) => Math.round(n * K);
const box = (pts: Point[]) => {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return `${art(x)}, ${art(y)}, ${art(Math.max(...xs) - x)}×${art(Math.max(...ys) - y)}`;
};
const pt = (p: Point) => `(${art(p.x)}, ${art(p.y)})`;
const esc = (s: string) => s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!);

/** The room drawn with what the code expects of it. */
async function referenceImage(room: RoomDef, file: string): Promise<void> {
  const poly = (pts: Point[], stroke: string, fill = 'none', width = 3) =>
    `<polygon points="${pts.map(p => `${art(p.x)},${art(p.y)}`).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
  const label = (x: number, y: number, text: string, color: string) =>
    `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="${color}" stroke="#000" stroke-width="4" paint-order="stroke">${esc(text)}</text>`;
  const dot = (p: Point, color: string, r = 7) => `<circle cx="${art(p.x)}" cy="${art(p.y)}" r="${r}" fill="${color}" stroke="#000" stroke-width="2"/>`;
  // A room whose painting is final is marked up on its painting; any other gets a schematic: the
  // flat back wall and floor, the floor line, true-size boxes for objects and Mara for scale.
  const final = MANIFEST.find(e => e.id === room.background)?.status === 'final';
  let svg = '';
  if (!final) {
    svg += `<rect width="${ROOM_SIZE.w}" height="${art(262)}" fill="#3b3a44"/><rect y="${art(262)}" width="${ROOM_SIZE.w}" height="${ROOM_SIZE.h - art(262)}" fill="#4a3e30"/>`;
    for (let x = 0; x <= ROOM_SIZE.w; x += 80) svg += `<line x1="${x}" y1="0" x2="${x}" y2="${ROOM_SIZE.h}" stroke="#ffffff" stroke-opacity="0.06"/>`;
    for (let y = 0; y <= ROOM_SIZE.h; y += 80) svg += `<line x1="0" y1="${y}" x2="${ROOM_SIZE.w}" y2="${y}" stroke="#ffffff" stroke-opacity="0.06"/>`;
    svg += label(8, art(262) - 8, 'back wall', '#9a98a8') + label(8, art(262) + 22, 'floor', '#b8a888');
  }
  svg += `<line x1="0" y1="${art(262)}" x2="${ROOM_SIZE.w}" y2="${art(262)}" stroke="#ffffff" stroke-width="2" stroke-dasharray="14 8"/>`;
  svg += poly(room.walkable.outer, '#3cff6a', 'rgba(60,255,106,0.10)');
  for (const h of room.walkable.holes) svg += poly(h, '#ff4040', 'rgba(255,64,64,0.25)');
  for (const f of room.foreground ?? []) {
    const s = pngSize(join(ART, 'foreground', `${f.image}.png`));
    svg += `<rect x="${art(f.x)}" y="${art(f.y)}" width="${s.w}" height="${s.h}" fill="rgba(0,220,255,0.12)" stroke="#00dcff" stroke-width="3" stroke-dasharray="10 6"/>`;
    svg += label(art(f.x) + 6, art(f.y) + 22, `fg: ${f.image}`, '#00dcff');
  }
  for (const h of room.hotspots) {
    svg += poly(h.polygon, h.secret ? '#c080ff' : '#ffd23c', 'none', 3);
    svg += label(art(Math.min(...h.polygon.map(p => p.x))) + 5, art(Math.min(...h.polygon.map(p => p.y))) + 19, h.id, h.secret ? '#c080ff' : '#ffd23c');
    if (h.walkTo) svg += dot(h.walkTo, '#3cb4ff', 6);
  }
  for (const [id, e] of Object.entries(room.entries)) { svg += dot(e, '#ff3cdc', 8); svg += label(art(e.x) + 10, art(e.y) + 6, id, '#ff3cdc'); }
  for (const o of room.objects) {
    // Its true-size frame standing on its foot point (art/manifest.mjs, OBJECT_FRAMES).
    const frame = MANIFEST.find(e => e.kind === 'object' && e.id === o.sheet)?.frame;
    if (frame) svg += `<rect x="${art(o.x) - frame.w / 2}" y="${art(o.y) - frame.h}" width="${frame.w}" height="${frame.h}" fill="rgba(255,140,26,0.14)" stroke="#ff8c1a" stroke-width="3"/>`;
    svg += `<path d="M${art(o.x) - 10} ${art(o.y)} h20 M${art(o.x)} ${art(o.y) - 10} v20" stroke="#ff8c1a" stroke-width="5"/>`;
    svg += label(art(o.x) + 10, art(o.y) - 8, `object: ${o.id}`, '#ff8c1a');
  }
  // Mara at true size (232 art pixels) on each entry, for scale.
  for (const e of Object.values(room.entries)) {
    svg += `<rect x="${art(e.x) - 30}" y="${art(e.y) - 232}" width="60" height="232" rx="26" fill="rgba(255,60,220,0.16)" stroke="#ff3cdc" stroke-width="2"/>`;
  }
  for (const a of room.actors) {
    svg += `<rect x="${art(a.x) - 30}" y="${art(a.y) - 226}" width="60" height="226" rx="26" fill="rgba(255,255,255,0.12)" stroke="#ffffff" stroke-width="2"/>`;
    svg += dot(a, '#ffffff', 9); svg += label(art(a.x) + 12, art(a.y) - 6, a.id, '#ffffff');
  }
  for (const s of Object.values(CROWDS[room.id]?.stations ?? {})) svg += dot(s, '#b4ff3c', 4);
  if (room.sign) {
    const s = room.sign;
    svg += `<rect x="${art(s.x - s.w / 2)}" y="${art(s.y)}" width="${art(s.w)}" height="${art(s.drop + s.h)}" fill="none" stroke="#ffffff" stroke-width="2" stroke-dasharray="6 6"/>`;
  }
  const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${ROOM_SIZE.w}" height="${ROOM_SIZE.h}">${svg}</svg>`;
  const base = final ? sharp(join(ART, `${file}.png`)) : sharp({ create: { width: ROOM_SIZE.w, height: ROOM_SIZE.h, channels: 3, background: '#202020' } });
  await base.composite([{ input: Buffer.from(overlay) }]).jpeg({ quality: 80 }).toFile(join(ART, '..', 'spec', `${file.split('/').pop()}.jpg`));
}

function sheetInfo(path: string): { frames: number; tags: string[]; size: string } {
  const json = JSON.parse(readFileSync(`${path}.json`, 'utf8'));
  const s = pngSize(`${path}.png`);
  return { frames: json.frames.length, tags: json.meta.frameTags.map((t: { name: string; from: number; to: number }) => `${t.name} (${t.to - t.from + 1})`), size: `${s.w}×${s.h}` };
}

export async function renderArtGuide(markdownOnly = true): Promise<string> {
  if (!markdownOnly) mkdirSync(join(ART, '..', 'spec'), { recursive: true });
  // Every chapter (their rooms and strings), chapters after the first included.
  const CHAPTER_LIST = await loadAllChapters();
  const en = TABLES.en;
  const md: string[] = [];
  const p = (s = '') => md.push(s);

  p('# Replacing the art');
  p();
  p('<!-- Generated by `npm run art:guide` from the game\'s data. Edit scripts/art-guide.ts, not this file. -->');
  p();
  p('Every image the game loads, what it must contain and where things go in it. Use the linked art procedure for approved replacement and registration.');
  p();
  p('[Art procedure](PIPELINE.md) · [Visual conventions](STYLE.md) · [Rig contracts](LAYERED-RIG.md) · [Reference map](REFERENCES.md) · [Intro contracts](briefs/INDEX-intro.md)');
  p();
  p('## Rooms');
  p();
  p(`Each room is one painting, ${ROOM_SIZE.w}×${ROOM_SIZE.h}, in \`art/src/rooms/\`. The reference image next to it shows what the code expects:`);
  p();
  p('- green: the floor Mara and the others can walk on; red: obstacles on the floor');
  p('- yellow: clickable things (purple: hidden secrets) with their ids; blue dots: where Mara stands to use them');
  p('- pink: where Mara enters the room; orange crosses: objects drawn over the room (their foot point); white dots: story characters\' feet; small green dots: background people\'s stations');
  p('- cyan dashed: walk-behind pieces (see below); white dashed: the hanging name board');
  p();
  p('Room geometry changes follow [the development guide](../DEVELOPMENT.md#authoring-chapter-content).');
  p();
  p('Outline extraction and inspection follow [the art procedure](PIPELINE.md#tool-selection).');
  p();
  // Intro references use the shared chapter adapter, including Silas's actual scale and atlas frames.
  for (const room of CHAPTER_LIST.filter(c => c.id !== 'intro').flatMap(c => Object.values(c.rooms))) {
    const file = roomFile(room.background);
    if (!markdownOnly) await referenceImage(room, file);
    p(`### ${en[`room.${room.id}`] ?? room.id}: \`${file}.png\``);
    p();
    const layout = `spec/${file.split('/').pop()}.jpg`;
    p(existsSync(join(ART, '..', layout)) ? `![${room.id}](${layout})` : `Layout image not generated: \`${layout}\`.`);
    p();
    p('| Clickable | Name | Box (x, y, w×h) | Mara stands at |');
    p('| --- | --- | --- | --- |');
    for (const h of room.hotspots) p(`| \`${h.id}\`${h.secret ? ' (secret)' : ''} | ${en[h.name] ?? h.name} | ${box(h.polygon)} | ${h.walkTo ? pt(h.walkTo) : '—'} |`);
    p();
    const extras: string[] = [];
    for (const o of room.objects) {
      // Later chapters keep their objects in their own folder (the manifest says where).
      const file = (MANIFEST.find(e => e.kind === 'object' && e.id === o.sheet)?.file ?? `objects/${o.sheet}.png`).replace(/\.png$/, '');
      const info = sheetInfo(join(ART, file));
      extras.push(`- Object \`${file}\` (${info.size}, tags ${info.tags.join(', ')}): foot point ${pt(o)}${o.movedTo ? `, moves to ${pt(o.movedTo)}` : ''}. Drawn on top of the room, so the painting should leave that spot free (or show what is behind it).`);
    }
    for (const f of room.foreground ?? []) {
      const s = pngSize(join(ART, 'foreground', `${f.image}.png`));
      extras.push(`- Walk-behind piece \`foreground/${f.image}.png\` (${s.w}×${s.h}, top left at ${pt(f)}): the same pixels as the room painting there, transparent elsewhere. It is drawn in front of anyone standing behind it. Cut it from the new painting.`);
    }
    for (const pr of room.props ?? []) {
      if ('image' in pr) extras.push(`- Animated prop \`props/${pr.image}.png\` (${pr.kind}) at ${pt(pr)}: ${pr.kind === 'gauge' ? 'a needle-less dial (the game draws the needle), centred there' : 'hung from its top edge at that point; it swings'}.`);
    }
    for (const a of room.actors) extras.push(`- ${en[`name.${a.id}`]} stands at ${pt(a)}.`);
    if (room.sign) extras.push(`- The name board hangs from ${pt(room.sign)} (about ${art(room.sign.w)}×${art(room.sign.drop + room.sign.h)}); it is painted by the game, so leave a quiet patch of wall there.`);
    if (room.look?.haze?.length) extras.push(`- Heat shimmer (High quality) over: ${room.look.haze.map(h => box([{ x: h.x, y: h.y }, { x: h.x + h.w, y: h.y + h.h }])).join('; ')}: hot spots in the painting (fires, lamps, pipes).`);
    if (room.ambient?.glows?.length) extras.push(`- Flickering light pools at ${room.ambient.glows.map(g => pt(g)).join(', ')}: lamps, kiln mouths, hearths in the painting.`);
    if (extras.length) { for (const e of extras) p(e); p(); }
  }

  p('## Characters');
  p();
  p('Character source, anatomy, anchors and cadence follow the [rig contracts](LAYERED-RIG.md) and each atlas. Current metadata:');
  p();
  p('| Sheet | Who | Must have | Now |');
  p('| --- | --- | --- | --- |');
  for (const c of CHARACTER_SHEETS) {
    const info = sheetInfo(join(ART, `${c.dir ?? ''}characters`, c.sheet));
    p(`| \`${c.sheet}\`${WEBP_SHEETS.includes(c.sheet) ? ' (ships as WebP)' : ''} | ${c.role} | ${c.tags.length} tags${c.optional ? ` (+ ${c.optional.join(', ')})` : ''} | ${info.size}, ${info.frames} frames |`);
  }
  p();
  p('Equipment and power variants retain their own registered sheets.');
  p();
  p('## Fights');
  p();
  for (const e of MANIFEST.filter(e => e.kind.startsWith('battle'))) p(`- \`${e.id}\`: \`art/src/${e.file}\` (${e.status}).`);
  p();
  p('## Portraits');
  p();
  p(`Dialogue portraits in \`art/src/portraits/\`: head and shoulders, **${FRAME}×${FRAME} per frame, side by side** in one strip. For each mood, a frame with the mouth closed, then one with it open (the game alternates them while a line is shown).`);
  p();
  p('| File | Moods in order | Strip size |');
  p('| --- | --- | --- |');
  for (const [who, moods] of Object.entries(PORTRAIT_MOODS)) p(`| \`portraits/${who}.png\` | ${moods.join(', ')} | ${FRAME * moods.length * 2}×${FRAME} |`);
  p();
  p('Background people have no portraits. To give one a portrait, add its strip and an entry in `PORTRAIT_MOODS` (`src/content/art.ts`).');
  p();
  p('## Satchel items and action icons');
  p();
  p(`- Items: \`art/src/items/<id>.png\`, **${ITEM_SIZE}×${ITEM_SIZE}**, transparent background: ${ITEMS.map(i => `\`${i}\` (${en[`name.${i}`]})`).join(', ')}.`);
  p(`- Action-ring icons: \`art/src/icons/<verb>.png\`, square, shown at ${ICON_SIZE}×${ICON_SIZE} (a larger square, such as 48×48, is fine and looks sharper): ${VERBS.map(v => `\`${v}\` (${en[`verb.${v}`]})`).join(', ')}.`);
  p();
  p('## Runtime graphics');
  p();
  p('Runtime effects and controls coexist with registered image assets; follow the manifest and scene wiring for each element.');
  p();
  return md.join('\n');
}

export async function generateArtGuide(options: { markdownOnly?: boolean; check?: boolean; outputDir?: string } = {}) {
  if (options.outputDir && !options.markdownOnly) throw new Error('--out-dir requires --markdown-only');
  if (options.check && !options.markdownOnly) throw new Error('--check requires --markdown-only');
  const markdown = await renderArtGuide(options.markdownOnly ?? false);
  const files = new Map([[join(resolve(options.outputDir ?? join(ART, '..')), 'REPLACING.md'), markdown]]);
  writeReferences(files, { check: options.check });
  if (!options.markdownOnly) {
    await writeWorldMapSpec();
    const { runRuntimeReferences } = await import('./art-reference-runtime');
    await runRuntimeReferences('intro');
  }
  return files;
}

export async function runArtGuide(args = process.argv.slice(2)) {
  let markdownOnly = false, check = false, outputDir: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--markdown-only') markdownOnly = true;
    else if (args[i] === '--check') check = true;
    else if (args[i] === '--out-dir' && args[i + 1] && !args[i + 1].startsWith('--')) outputDir = args[++i];
    else throw new Error(`Unknown or incomplete art guide option: ${args[i]}`);
  }
  await generateArtGuide({ markdownOnly, check, outputDir });
  console.log(`${check ? 'Checked' : 'Generated'} art guide${markdownOnly ? ' Markdown only' : ' and layouts'}.`);
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await runArtGuide();
