/** Read-only adapter: implemented chapter data and existing image metadata -> art references. */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MANIFEST, RIGS } from '../art/manifest.mjs';
import type { ArtEntry } from '../art/manifest.mjs';
import { loadAllChapters } from '../src/chapters';
import { TABLES } from '../src/engine/i18n';
import { renderReference, writeReferences } from './art-reference';
import type { ReferenceAsset, ReferenceRoom, ReferenceSpec } from './art-reference';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const posix = (p: string) => p.replaceAll('\\', '/');
const A = (n: number) => Math.round(n * 2);
const flags = (value: unknown) => value ? JSON.stringify(value) : 'Always';

/** Canvas size, not the alpha bounding box: variants must retain exact atlas registration. */
export async function runtimeDimensions(entry: ArtEntry, root = ROOT): Promise<{ width: number; height: number }> {
  if (entry.sheet && existsSync(join(root, 'art/src', entry.sheet))) {
    const atlas = JSON.parse(readFileSync(join(root, 'art/src', entry.sheet), 'utf8'));
    const frames = Array.isArray(atlas.frames) ? atlas.frames : Object.values(atlas.frames ?? {});
    const first = frames[0] as { sourceSize?: { w: number; h: number }; frame?: { w: number; h: number } } | undefined;
    const size = first?.sourceSize ?? first?.frame;
    if (size) return { width: size.w, height: size.h };
  }
  if (entry.frame) return { width: entry.frame.w, height: entry.frame.h };
  if (entry.size) return { width: entry.size.w, height: entry.size.h };
  const file = join(root, 'art/src', entry.file);
  if (existsSync(file)) {
    const metadata = await sharp(file).metadata();
    if (metadata.width && metadata.height) return { width: metadata.width, height: metadata.height };
  }
  const declared = entry.spec?.join(' ').match(/(\d{2,4})\s*[×x]\s*(\d{2,4})/);
  if (declared) return { width: Number(declared[1]), height: Number(declared[2]) };
  // Unproduced actor/pack art is described by the existing full source canvas, not a guessed room sprite.
  if (entry.kind === 'pack' || entry.kind === 'character') return { width: 1024, height: 1536 };
  if (entry.kind === 'portrait') return { width: 128, height: 128 };
  if (entry.width || entry.height) return { width: entry.width ?? entry.height!, height: entry.height ?? entry.width! };
  throw new Error(`No authoritative reference dimensions for ${entry.id}; add explicit metadata before drawing.`);
}

function sourceLine(root: string, file: string, needle: string) {
  const lines = readFileSync(join(root, file), 'utf8').split(/\r?\n/);
  const line = lines.findIndex(s => s.includes(needle));
  return { file, ...(line >= 0 ? { anchor: `L${line + 1}` } : {}) };
}

/** No private files are read by this adapter. Condition text comes directly from implemented flags. */
export async function runtimeReference(chapterId: string, root = ROOT): Promise<ReferenceSpec> {
  const chapters = await loadAllChapters();
  const chapter = chapters.find(c => c.id === chapterId);
  if (!chapter) throw new Error(`Unknown implemented chapter: ${chapterId}`);
  const name = (key: string) => TABLES.en[key] ?? key;
  const roomsFile = `src/chapters/${chapterId}/rooms.ts`;
  const heroName = name(chapter.hero?.name ?? 'speaker.mara');
  const heroHeight = Number(RIGS[chapter.hero?.sheet ?? 'mara']?.height ?? 232);
  const roomList = Object.values(chapter.rooms);
  const spec: ReferenceSpec = {
    id: chapterId, title: name(chapter.title), private: false, rooms: [], assets: [],
    hero: { name: heroName, height: heroHeight },
    regeneration: `npm run art:briefs -- --chapter ${chapterId}`,
    rules: [
      'Generated from implemented chapter definitions and the art manifest. Edit those sources, not the reference outputs.',
      `Viewpoint: ${heroName}, ${heroHeight} art pixels tall. Room coordinates and dimensions are art pixels; divide by two for logical game units.`,
      'Interactive targets, drawn sprites and foreground cuts are separate lists. A drawing may support more than one target; a target may be painted into existing approved art.',
      'Reference diagrams show conditional placements together and label their source flags; they are not a claim that every pickup is visible at the same gameplay moment.',
      'Preserve approved artwork, including the prison cage perspective. Descriptive corrections do not authorise redraws, imports or gameplay changes.',
    ],
  };
  for (const room of roomList) {
    const bg = MANIFEST.find(e => e.id === room.background)!;
    const referenceRoom: ReferenceRoom = {
      id: room.id, title: name(`room.${room.id}`) === `room.${room.id}`
        ? room.id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
        : name(`room.${room.id}`), assetId: bg.id,
      description: bg.subject, background: bg.subject,
      source: [sourceLine(root, roomsFile, `  ${room.id}: {`)],
      backgroundVariants: (room.backgroundWhen ?? []).map(b => ({assetId:b.background,condition:flags(b.if)})),
      stages: [{ id: 'reference', description: 'All implemented conditional placements; each target and sprite lists its own flag conditions.' }],
      targets: room.hotspots.map(h => {
        const xs = h.polygon.map(p => A(p.x)), ys = h.polygon.map(p => A(p.y));
        return { id: h.id, title: name(h.name), verbs: [...h.verbs],
          bounds: { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) },
          condition: flags(h.visibleIf), source: sourceLine(root, roomsFile, `id: '${h.id}'`),
          assetId: room.objects.find(o => h.outline?.objects?.includes(o.id) || o.id === h.id)?.sheet,
        };
      }),
      exits: room.hotspots.filter(h => h.verbs.includes('go')).map(h => ({ label: name(h.name), x: A(h.walkTo?.x ?? h.polygon[0].x), y: A(h.walkTo?.y ?? h.polygon[0].y), description: `Target ${h.id}; ${flags(h.visibleIf)}.` })),
      actors: [
        ...Object.entries(room.entries).map(([id, e]) => ({ label: `${heroName}: ${id}`, x: A(e.x), y: A(e.y), height: heroHeight })),
        ...room.actors.map(a => ({ label: name(`name.${a.id}`), x: A(a.x), y: A(a.y), height: Number(RIGS[a.id]?.height ?? 224) })),
      ],
      walkable: { outer: room.walkable.outer.map(p => ({ x: A(p.x), y: A(p.y) })), holes: room.walkable.holes.map(h => h.map(p => ({ x: A(p.x), y: A(p.y) }))) },
      notes: [
        `Primary background: ${room.background}. Existing painting: art/src/${bg.file}.`,
        ...room.actors.map(a => `Actor target ${a.id}: ${(chapter.actorVerbs[a.id] ?? []).join(', ') || 'no direct action'}; visibility ${flags(a.visibleIf)}. Actor scale and placement are listed separately; no new actor artwork is requested.`),
        ...((room.backgroundWhen ?? []).map(b => `Alternate background ${b.background}: ${flags(b.if)}. Keep this implemented background switch; do not invent a removable cloak sprite.`)),
        ...((room.walkableWhen ?? []).map(w => `Changed walking area: ${flags(w.if)}; outer=${JSON.stringify(w.walkable.outer.map(p => [A(p.x), A(p.y)]))}.`)),
        'Sprite dimensions are read from each existing atlas sourceSize, preserving transparent frame registration. The room diagram uses those dimensions rather than old manifest guesses.',
      ],
    };
    spec.rooms.push(referenceRoom);
  }
  const entries = MANIFEST.filter(e => e.chapter === chapterId);
  const preferred = roomList.flatMap(room => [room.background, ...(room.backgroundWhen ?? []).map(b => b.background),
    ...room.hotspots.flatMap(h => room.objects.filter(o => h.outline?.objects?.includes(o.id) || o.id === h.id).map(o => o.sheet)),
    ...room.objects.map(o => o.sheet), ...(room.foreground ?? []).map(f => f.image)]);
  const rank = (e: ArtEntry) => { const i = preferred.indexOf(e.id); return i < 0 ? preferred.length : i; };
  entries.sort((a, b) => rank(a) - rank(b));
  for (const entry of entries) {
    const dims = await runtimeDimensions(entry, root);
    const placements: ReferenceAsset['placements'] = [];
    const interactions = new Set<string>();
    for (const room of roomList) {
      for (const o of room.objects.filter(o => o.sheet === entry.id)) {
        const hits = room.hotspots.filter(h => h.outline?.objects?.includes(o.id) || h.id === o.id);
        hits.forEach(h => h.verbs.forEach(v => interactions.add(v)));
        placements.push({ id: `${room.id}-${o.id}`, room: room.id, x: A(o.x), y: A(o.y), layer: 'world', stages: ['reference'],
          instance: o.id, state: o.whenFalse ?? entry.tags?.[0] ?? 'idle', condition: `${flags(o.visibleIf)}${o.flag ? `; ${o.flag}: ${o.whenFalse} -> ${o.whenTrue}` : ''}` });
      }
      for (const f of (room.foreground ?? []).filter(f => f.image === entry.id)) {
        placements.push({ id: `${room.id}-${f.image}`, room: room.id, x: A(f.x), y: A(f.y), instance: f.image, layer: 'foreground', stages: ['reference'], condition: 'Always' });
      }
    }
    const tags = entry.tags?.length ? entry.tags : ['idle'];
    const notes = [`Existing file: art/src/${entry.file}. Status: ${entry.status}. No new artwork is produced by reference generation.`];
    if (!existsSync(join(root, 'art/src', entry.file))) notes.push('Requested source artwork does not exist yet; use its manifest specification, not a fabricated delivered status.');
    if (entry.builtFrom) notes.push(`Derived from ${entry.builtFrom}; do not draw this derived sheet separately.`);
    if (entry.spec) notes.push(...entry.spec);
    if (entry.kind === 'foreground') notes.push(entry.cut ? 'Cut from the approved background using manifest cut geometry.' : 'This is a separately delivered/registered foreground overlay, not an instruction to cut a new image from the room painting.');
    if (entry.kind === 'room') {
      const use = roomList.find(r => r.background === entry.id || r.backgroundWhen?.some(b => b.background === entry.id));
      if (use) notes.push(`Room context: ${use.id}.${use.background !== entry.id ? ' This is a conditional background variant of that same room.' : ''}`);
    }
    spec.assets.push({
      id: entry.id, title: entry.id, kind: entry.kind, ...dims,
      anchor: entry.anchor === 'top-left' ? 'top-left' : entry.anchor === 'none' ? 'none' : 'bottom-centre',
      description: entry.subject, classification: entry.kind === 'foreground' ? 'foreground' : interactions.size ? 'target' : 'visual',
      interaction: [...interactions],
      states: tags.map(id => ({ id, description: entry.subject, condition: `Existing ${id} frame; placement flag conditions above determine when it is used.` })),
      placements, source: [sourceLine(root, 'art/manifest.mjs', `'${entry.id}'`), { file: roomsFile }, { file: `src/chapters/${chapterId}/interactions.ts` }],
      notes, status: entry.status,
      files: Object.fromEntries(tags.map(id => [id, entry.kind === 'object' ? `art/inbox/${entry.id}-${id}.png` : `art/inbox/${entry.id}.png`])),
    });
  }
  return spec;
}

function addNavigation(files: Map<string, string | Uint8Array>, root: string, id: string, title: string) {
  const marker = `<!-- chapter-reference:${id} -->`;
  const block = `${marker}\n## Chapter reading order: ${title}\n\nStart with [the room and puzzle index](INDEX-${id}.md). It separates interactive targets, changing sprites and foreground cuts, and links directly to implemented sources.\n<!-- /chapter-reference:${id} -->`;
  for (const name of ['INDEX.md', 'CATALOG.md']) {
    const path = join(root, 'art/briefs', name);
    const staged = files.get(path);
    const original = typeof staged === 'string' ? staged : readFileSync(path, 'utf8');
    const pattern = new RegExp(`<!-- chapter-reference:${id} -->[\\s\\S]*?<!-- /chapter-reference:${id} -->`);
    let content = original.includes(marker) ? original.replace(pattern, block) : original.replace(/\n/, `\n\n${block}\n`);
    files.set(path, content);
  }
}

/** Render everything, including JPEG layouts and navigation, without writing outputs. */
export async function renderRuntimeReferences(chapterId: string, root = ROOT, staged = new Map<string, string | Uint8Array>(), markdownOnly = false) {
  const spec = await runtimeReference(chapterId, root);
  const files = renderReference(spec, { outputDir: join(root, 'art/briefs'), rootDir: root, markdownOnly });
  // Existing brief filenames remain stable for every manifest entry, including conditional room backgrounds.
  if (!markdownOnly) for (const room of spec.rooms) {
    const svgPath = join(root, 'art/spec', `${room.id}.svg`);
    const svg = files.get(svgPath);
    if (typeof svg !== 'string') throw new Error(`Shared renderer did not emit ${posix(relative(root, svgPath))}`);
    const asset = MANIFEST.find(e => e.id === room.assetId)!;
    const basename = asset.file.split('/').pop()!.replace(/\.png$/, '');
    const jpeg = await sharp(Buffer.from(svg)).extract({ left: 34, top: 110, width: 1280, height: 720 }).jpeg({ quality: 85 }).toBuffer();
    files.set(join(root, 'art/spec', `${basename}.jpg`), jpeg);
  }
  for (const name of ['INDEX.md', 'CATALOG.md']) {
    const file = join(root, 'art/briefs', name);
    const content = staged.get(file);
    if (content !== undefined) files.set(file, content);
  }
  addNavigation(files, root, chapterId, spec.title);
  return { spec, files };
}

export async function runRuntimeReferences(chapterId: string, check = false, root = ROOT, markdownOnly = false) {
  const { spec, files } = await renderRuntimeReferences(chapterId, root, undefined, markdownOnly);
  writeReferences(files, { check });
  console.log(`${check ? 'Checked' : 'Generated'} ${chapterId} references: ${spec.rooms.length} rooms, ${spec.assets.length} assets; gameplay and artwork unchanged.`);
  return files;
}
