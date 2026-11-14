// Public asset contracts. Common procedures live in repository guides, never in these templates.
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MANIFEST as DEFAULT_MANIFEST, PILOT, RIGS } from '../art/manifest.mjs';
import type { ArtEntry } from '../art/manifest.mjs';
import { loadAllChapters } from '../src/chapters';
import { CROWDS } from '../src/chapters/ch1/crowd';
import { TABLES } from '../src/engine/i18n';
import type { Point, RoomDef } from '../src/engine/types';
import { renderRuntimeReferences, runtimeDimensions } from './art-reference-runtime';
import { writeReferences } from './art-reference';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function validateBriefManifest(entries: readonly ArtEntry[]): void {
  const problems: string[] = [];
  const ids = new Set<string>();
  const safePath = (value: unknown) => typeof value === 'string' && value.trim().length > 0
    && !value.startsWith('/') && !value.includes('\\') && !value.includes(':')
    && value.split('/').every(part => part !== '..' && part !== '.');
  for (const entry of entries) {
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(entry.id) || ids.has(entry.id)) problems.push(`${entry.id}: invalid or duplicate asset id`);
    ids.add(entry.id);
    if (entry.sourceReference !== undefined) {
      if (entry.kind !== 'pack' || !safePath(entry.sourceReference)) problems.push(`${entry.id}: sourceReference must be an art-relative source path on a pack reference`);
      if (entry.pack !== undefined || entry.piece !== undefined) problems.push(`${entry.id}: sourceReference cannot also be a deliverable pack piece`);
    } else if (entry.kind === 'pack') {
      if (!safePath(entry.pack) || !safePath(entry.piece)) problems.push(`${entry.id}: deliverable pack requires valid pack and piece metadata`);
    }
    if (entry.kind === 'object' && !entry.tags?.length) problems.push(`${entry.id}: object requires state tags`);
  }
  if (problems.length) throw new Error(`Invalid art brief metadata:\n${problems.join('\n')}`);
}

/** Stage all requested outputs before any writes, including the implemented intro adapter. */
export async function renderFullBriefs(MANIFEST: readonly ArtEntry[] = DEFAULT_MANIFEST, markdownOnly = false) {
  validateBriefManifest(MANIFEST);
  const art = join(ROOT, 'art'), out = join(art, 'briefs');
  const files = new Map<string, string | Uint8Array>();
  const CHAPTERS = await loadAllChapters();
  const en = TABLES.en;
  const name = (key: string) => en[key] ?? key;
  const A = (n: number) => Math.round(n * 2);
  const box = (pts: Point[]) => `x ${A(Math.min(...pts.map(p => p.x)))}–${A(Math.max(...pts.map(p => p.x)))}, y ${A(Math.min(...pts.map(p => p.y)))}–${A(Math.max(...pts.map(p => p.y)))}`;
  const VERB_WORDS: Record<string, string> = { look: 'look at', open: 'open', close: 'close', take: 'take', use: 'use', talk: 'talk to', go: 'go through' };
  const ROOMS_BY_BACKGROUND = new Map<string, { chapter: string; room: RoomDef }[]>();
  for (const c of CHAPTERS) for (const room of Object.values(c.rooms)) {
    const list = ROOMS_BY_BACKGROUND.get(room.background) ?? [];
    list.push({ chapter: c.id, room }); ROOMS_BY_BACKGROUND.set(room.background, list);
  }
  const guides = '[Art procedure](../PIPELINE.md) · [Visual conventions](../STYLE.md) · [Rig contracts](../LAYERED-RIG.md) · [Assignments and approval](../../WORKFLOW.md)';

  function functional(e: ArtEntry): string[] {
    const lines: string[] = [];
    switch (e.kind) {
      case 'room': {
        for (const { chapter, room } of ROOMS_BY_BACKGROUND.get(e.id) ?? []) {
          lines.push(`In the game as the room \`${room.id}\` (${chapter}). Walkable region: ${box(room.walkable.outer)}${room.walkable.holes.length ? `, around ${room.walkable.holes.length} obstacle(s)` : ''}.`);
          lines.push('', 'Everything the player can click, at these places (art pixels), each must be painted there and recognisable:');
          for (const h of room.hotspots) {
            const verbs = h.verbs.map(v => VERB_WORDS[v] ?? v).join(', ');
            lines.push(`- **${name(h.name)}** (\`${h.id}\`, ${box(h.polygon)}): ${verbs}${h.verbs.includes('go') ? ' (an exit)' : ''}${h.secret ? '. A secret: a small, easy-to-miss detail, not highlighted' : ''}${h.visibleIf ? '. Only there at some points of the story' : ''}.`);
          }
          if (room.objects.length) {
            lines.push('', 'Drawn separately as objects (leave their spot plain in the painting, they stand there):');
            for (const o of room.objects) lines.push(`- \`${o.sheet}\` standing on (${A(o.x)}, ${A(o.y)})${o.movedTo ? `, later moved to (${A(o.movedTo.x)}, ${A(o.movedTo.y)})` : ''}.`);
          }
          for (const p of room.props ?? []) if ('image' in p) lines.push(`- The prop \`prop-${p.image}\` is drawn by the game at (${A(p.x)}, ${A(p.y)}); paint only what holds it.`);
          if (room.actors.length) lines.push('', `Story characters stand at: ${room.actors.map(a => `${name(`name.${a.id}`)} (${A(a.x)}, ${A(a.y)})`).join('; ')}. Keep the wall behind them uncluttered at head height.`);
          if (CROWDS[room.id]) lines.push('', 'Background people walk about the floor band here (the crowd); keep the band open.');
          if (room.foreground?.length) lines.push('', `Walk-behind pieces are cut from this painting: ${room.foreground.map(f => `\`${f.image}\` (from (${A(f.x)}, ${A(f.y)}))`).join(', ')}: paint those things in front of the floor there.`);
          if (room.sign) lines.push('', `The game hangs the room's name board around (${A(room.sign.x)}, ${A(room.sign.y)}): keep that patch of wall plain.`);
          if (room.coldIf) lines.push('', 'Later in the story the game cools this room\'s colours (the kiln dies): do not paint that, paint it warm.');
          lines.push('');
        }
        break;
      }
      case 'object': {
        const uses = [...ROOMS_BY_BACKGROUND.values()].flat().flatMap(({ room }) => room.objects.filter(o => o.sheet === e.id).map(o => ({ room, o })));
        for (const { room, o } of uses) lines.push(`Stands in the room \`${room.id}\` on its foot point (${A(o.x)}, ${A(o.y)}) (bottom centre of the picture)${o.flag ? `; it shows "${o.whenTrue}" or "${o.whenFalse}" as the story moves on` : ''}.`);
        lines.push(`States: ${e.tags!.join(', ')}: one picture each, identical framing; only what changes between states differs.`);
        break;
      }
      case 'character': case 'extra': {
        const rooms = [...ROOMS_BY_BACKGROUND.values()].flat().filter(({ room }) => room.actors.some(a => `char-${a.id}` === e.id)).map(({ room }) => room.id);
        const crowd = Object.entries(CROWDS).filter(([, c]) => c.extras.some(x => x.sheet === e.id)).map(([r]) => r);
        if (e.id.startsWith('char-mara')) lines.push('Mara is the player\'s character: he walks every room, crouches, lies down, talks (the rig animates this one drawing).');
        if (rooms.length) lines.push(`Appears in: ${rooms.join(', ')}.`);
        if (crowd.length) lines.push(`A background person in: ${crowd.join(', ')} (walks about, works, now and then says a line).`);
        if (e.height) lines.push(`In the game ${e.height} art pixels tall (${Math.round((e.height ?? 0) / 2)} pixels on the 2-pixel grid; the face is only a couple of dozen pixels): design for that size, with a clear silhouette, a distinctive head and colours that tell them apart from everyone else in the cast.`);
        if (e.id === 'char-mara-casual') lines.push('Mara at the start of a new adventure: he wakes in his tent in everyday clothes and gears up (armour, the gauntlet) when he takes the ember cell from its cradle. Identical face, hair, skin, build and height to char-mara, so the player knows him at once.');
        break;
      }
      case 'battle': lines.push('The creature\'s sprite in the room: it squeezes out of the gallery\'s round hatch and leaps to the floor before the fight (the fight screen itself uses battle-enemy-scavenger). Drawn facing left; the game mirrors it as needed.'); break;
      case 'battle-portrait': lines.push(e.id === 'battle-hero' ? 'The fight screen\'s Mara (left side), facing right.' : 'Shown on the fight screen on the right, facing left towards Mara.'); break;
      case 'battle-backdrop': lines.push('The fight screen\'s backdrop: the fighters stand on its lower third, the cards cover the bottom.'); break;
      case 'prop': lines.push(e.id.startsWith('creature-') ? 'The creature\'s small sprite in the room: it comes out of the grate, the pipe or the pit, hops towards Mara, then the fight starts.' : 'A separately rendered prop; placement and behavior follow its description and chapter definition.'); break;
      case 'item': lines.push('A satchel item: shown in the inventory bar and on the cursor while it is being used.'); break;
      case 'pack': lines.push(e.phase === 1
        ? `Phase 1 of ${e.pack}: source standing figure used for the later pieces.`
        : `Phase 2 of ${e.pack}, derived from its approved Phase 1 master; retain the source pack's joints and registration.`); break;
      case 'icon': lines.push(e.id === 'cursor-work-glove' ? 'Browser interaction cursor.' : e.id === 'strain-warning' ? 'Gauntlet strain HUD warning.' : 'An action-ring icon.'); break;
      case 'card': lines.push('A card picture on the fight screen, shown at about 120 px in the hand and larger when looked at.'); break;
      case 'map': lines.push("The world map in the notebook's Map tab, shown about 480 px wide. The game writes each known place's name next to its mark and pins where the character is, so the painting has no lettering at all."); break;
      case 'equipment': lines.push(`A gear picture on the gear screen (the paper doll's slot and the loot-style preview). Tier ${e.tier ?? 1} of 10: keep the same silhouette, framing and angle as the other tiers of this piece.`); break;
      default: break;
    }
    return e.chapter === 'kofi1' ? lines.map(line => line.replaceAll('Mara', 'Kofi')) : lines;
  }

  async function brief(e: ArtEntry): Promise<string> {
    if (e.sourceReference) return [
      `# ${e.id}`, '', 'Reference only; no production or installed status is implied.', '',
      `Source: [art/${e.sourceReference}](../${e.sourceReference})`, '', e.subject, '', guides, '',
    ].join('\n');
    const lines = [`# ${e.id}`, '', `Status: **${e.status}** · ${e.kind} · chapter ${e.chapter}`, '', guides, '',
      '## Description', '', e.subject, ''];
    if (e.builtFrom) {
      lines.push(`Derived from the \`${e.builtFrom}\` source pack; no separate drawing.`, '');
      return lines.join('\n');
    }
    if (['portrait', 'card-atlas', 'foreground'].includes(e.kind) || e.id === 'room-tent') {
      lines.push(e.kind === 'portrait' ? 'Portrait derived from its character source.' : e.kind === 'card-atlas' ? 'Atlas assembled from the card images.' : e.kind === 'foreground' ? 'Foreground cut from its room painting.' : 'Uses the approved tent reference.', '');
      return lines.join('\n');
    }
    lines.push('## Use and placement', '', ...functional(e), '', '## Asset contract', '',
      `- Runtime path: \`art/src/${e.file}\` (${e.status === 'requested' ? 'requested; not an installation record' : e.status}).`,
      `- Anchor: \`${e.anchor}\`.`);
    const size = e.status === 'requested' ? e.frame ?? e.size : await runtimeDimensions(e);
    if (size) {
      const w = 'width' in size ? size.width : size.w, h = 'height' in size ? size.height : size.h;
      lines.push(`- Canvas/frame: **${w}×${h} art px**.`);
    }
    if (e.height) lines.push(`- Figure height: ${e.height} art px.`);
    if (e.width) lines.push(`- Figure width: ${e.width} art px.`);
    if (e.tags?.length) lines.push(`- State tags: ${e.tags.map(t => `\`${t}\``).join(', ')}.`);
    if (e.moods?.length) lines.push(`- Portrait moods: ${e.moods.join(', ')}.`);
    if (e.kind === 'pack') lines.push(`- Source pack/piece: \`${e.pack}/${e.piece}\`${e.phase ? `; phase ${e.phase}` : ''}.`);
    const rig = e.rig ? RIGS[e.rig] : undefined;
    if (rig?.source) lines.push(`- Rig source: \`art/${rig.source}\`.`);
    if (e.light) lines.push(`- Light sources: ${e.light}`);
    if (e.spec) lines.push(...e.spec.map(s => `- ${s}`));
    if (e.sheet) lines.push(`- Atlas metadata: \`art/src/${e.sheet}\`.`);
    if (e.kind === 'object') lines.push(`- Import names: ${e.tags!.map(t => `\`${e.id}-${t}.png\``).join(', ')}.`);
    const layout = e.kind === 'room' ? `spec/${e.file.split('/').pop()!.replace(/\.png$/, '.jpg')}` : e.kind === 'map' ? 'spec/world-map.png' : undefined;
    if (layout && existsSync(join(art, layout))) lines.push('', `[Layout](../${layout})`);
    lines.push('');
    return lines.join('\n');
  }

  for (const e of MANIFEST) if (e.chapter !== 'intro') {
    try { files.set(join(out, `${e.id}.md`), await brief(e)); }
    catch (error) { throw new Error(`Cannot render art brief ${e.id}: ${error instanceof Error ? error.message : error}`, { cause: error }); }
  }
  files.set(join(out, 'INDEX.md'), ['# Asset reference index', '', guides, '',
    'Generated from the manifest. [Grouped catalog](CATALOG.md) · [Pilot references](PILOT.md).', '',
    '| Asset | Kind | Chapter | Status |', '| --- | --- | --- | --- |',
    ...MANIFEST.map(e => `| [${e.id}](${e.id}.md) | ${e.kind} | ${e.chapter} | ${e.sourceReference ? 'reference only' : e.status} |`), '',
  ].join('\n'));
  files.set(join(out, 'PILOT.md'), ['# Pilot references', '', guides, '',
    ...PILOT.filter(id => MANIFEST.some(e => e.id === id)).map(id => `- [${id}](${id}.md)`), '',
  ].join('\n'));
  const catalog = ['# Asset reference catalog', '', guides, ''];
  for (const chapter of new Set(MANIFEST.map(e => e.chapter))) {
    catalog.push(`## ${chapter}`, '');
    for (const e of MANIFEST.filter(e => e.chapter === chapter)) catalog.push(
      e.sourceReference ? `- **${e.id}**: [reference](${e.id}.md) → \`art/${e.sourceReference}\` (reference only).`
        : `- **${e.id}**: [brief](${e.id}.md) · ${e.kind} · ${e.status}.`);
    catalog.push('');
  }
  files.set(join(out, 'CATALOG.md'), catalog.join('\n'));
  const { files: introFiles } = await renderRuntimeReferences('intro', ROOT, files, markdownOnly);
  for (const [file, content] of introFiles) files.set(file, content);
  return files;
}

export async function generateFullBriefs(options: { manifest?: readonly ArtEntry[]; outputDir?: string; check?: boolean; markdownOnly?: boolean } = {}) {
  const files = await renderFullBriefs(options.manifest, options.markdownOnly);
  const outputDir = resolve(options.outputDir ?? join(ROOT, 'art'));
  const relocated = new Map([...files].filter(([file]) => !options.markdownOnly || file.endsWith('.md'))
    .map(([file, content]) => [join(outputDir, relative(join(ROOT, 'art'), file)), content]));
  writeReferences(relocated, { check: options.check });
  return relocated;
}

export async function runArtBriefs(args = process.argv.slice(2)) {
  let chapterId: string | undefined, privateSpec: string | undefined, outputDir: string | undefined;
  let check = false, markdownOnly = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') check = true;
    else if (args[i] === '--markdown-only') markdownOnly = true;
    else if (['--chapter', '--private-spec', '--out-dir'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) {
      const option = args[i], value = args[++i];
      if (option === '--chapter') chapterId = value;
      else if (option === '--private-spec') privateSpec = value;
      else outputDir = value;
    } else throw new Error(`Unknown or incomplete reference option: ${args[i]}`);
  }
  if (chapterId && privateSpec) throw new Error('Choose exactly one of --chapter <id> or --private-spec <path>.');
  if ((chapterId || privateSpec) && outputDir) throw new Error('--out-dir is only supported for the full public catalog.');
  if (privateSpec) {
    const { runPrivateReferences } = await import('./art-reference-private');
    await runPrivateReferences(privateSpec, check, ROOT, markdownOnly);
  } else if (chapterId) {
    const { runRuntimeReferences } = await import('./art-reference-runtime');
    await runRuntimeReferences(chapterId, check, ROOT, markdownOnly);
  } else {
    const files = await generateFullBriefs({ outputDir, check, markdownOnly });
    console.log(`${check ? 'Checked' : 'Generated'} full art catalog: ${files.size} files. Task queues untouched.`);
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await runArtBriefs();
