// Writes a Codex brief per picture (art/briefs/<id>.md) from the art manifest, the descriptions
// (art/descriptions.mjs), the game's own rooms and the style bible, plus art/briefs/INDEX.md (every
// picture with its status) and art/briefs/PILOT.md (the style test). Each brief has three parts:
// what the game does with the picture (functional), its sizes and delivery (technical), and the
// prompt to paint from (visual). art/CODEX.md says in what order to make them.
//
//   npm run art:briefs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFEST, PILOT, RIGS } from '../art/manifest.mjs';
import type { ArtEntry } from '../art/manifest.mjs';
import { loadAllChapters } from '../src/chapters';
import { CROWDS } from '../src/chapters/ch1/crowd';
import { TABLES } from '../src/engine/i18n';
import type { Point, RoomDef } from '../src/engine/types';

const art = join(dirname(fileURLToPath(import.meta.url)), '..', 'art');
const out = join(art, 'briefs');
mkdirSync(out, { recursive: true });
const palette: string[] = JSON.parse(readFileSync(join(art, 'style', 'palette.json'), 'utf8')).colours;
const CHAPTERS = await loadAllChapters();
const en = TABLES.en;
const name = (key: string) => en[key] ?? key;
const A = (n: number) => Math.round(n * 2); // world units to art pixels
const box = (pts: Point[]) => {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return `x ${A(x)}–${A(Math.max(...xs))}, y ${A(y)}–${A(Math.max(...ys))}`;
};
const VERB_WORDS: Record<string, string> = { look: 'look at', open: 'open', close: 'close', take: 'take', use: 'use', talk: 'talk to', go: 'go through' };

/** Every room in every chapter, by its painting's manifest id. */
const ROOMS_BY_BACKGROUND = new Map<string, { chapter: string; room: RoomDef }[]>();
for (const c of CHAPTERS) for (const room of Object.values(c.rooms)) {
  const list = ROOMS_BY_BACKGROUND.get(room.background) ?? [];
  list.push({ chapter: c.id, room });
  ROOMS_BY_BACKGROUND.set(room.background, list);
}

const STYLE = [
  'Style: detailed pixel art matching tent-reference.png (attached): hand-placed pixels, clean readable shapes, crisp edges (no blur or anti-aliased haze), worn lived-in materials (patched canvas, scuffed wood with iron corner plates, brass, glazed clay, soot and ash). It is reduced to a 2-pixel grid on import (a room becomes 640×360 pixels), so use clear shapes and flat colour areas.',
  'World: the Ashlands, an industrial-fantasy land: kiln villages of fired clay and cream ceramic plates in the ash country, and Ironhaven, a hard city of iron, stone and snow; brass, soot, ochre cloth, ember light. Everything used and repaired, nothing shiny or new, no modern objects.',
  `Colour: keep to the attached master palette (art/style/palette.png, ${palette.length} colours: ochre, rust, brass, ember orange, clay, warm browns; soot greys and iron blue-greys). Every pixel is snapped to it on import.`,
  'Never: text or letters in the picture, people in rooms, perspective, lens effects, neon, painted glow pools, light shafts, haze or particles (the game adds light and effects).',
];
const FLAT = 'Staging: flat 2D, like a stage set: no perspective, no vanishing point, the camera straight at the back wall at eye level, no side walls. The back wall meets the floor at y 524; the floor band below it (y 536–690) is where people walk, always the same size. Furniture stands against the back wall on the floor line or hangs on the wall above it.';
const EVEN = 'Light: evenly lit with soft form shading and no strong cast light (the game lights it to match the room).';
const ROOM_LIGHT = 'Light: paint the room evenly lit. Show the light sources named above as things in the room (lamps, fire, a lit doorway), with only soft ambient shading (darker under furniture, in the corners and high up). The game adds the glow, the flicker and the colour of the light.';

// ----------------------------------------------------------------------- functional ---
function functional(e: ArtEntry): string[] {
  const lines: string[] = [];
  switch (e.kind) {
    case 'room': {
      for (const { chapter, room } of ROOMS_BY_BACKGROUND.get(e.id) ?? []) {
        lines.push(`In the game as the room \`${room.id}\` (${chapter}). Mara (232 px tall) and the others walk in the floor band: ${box(room.walkable.outer)}${room.walkable.holes.length ? `, around ${room.walkable.holes.length} obstacle(s)` : ''}.`);
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
      lines.push(`In the game ${e.height} art pixels tall (${Math.round((e.height ?? 0) / 2)} pixels on the 2-pixel grid; the face is only a couple of dozen pixels): design for that size, with a clear silhouette, a distinctive head and colours that tell them apart from everyone else in the cast.`);
      if (e.id === 'char-mara-casual') lines.push('Mara at the start of a new adventure: he wakes in his tent in everyday clothes and gears up (armour, the gauntlet) when he takes the ember cell from its cradle. Identical face, hair, skin, build and height to char-mara, so the player knows him at once.');
      break;
    }
    case 'battle': lines.push('The creature\'s sprite in the room: it squeezes out of the gallery\'s round hatch and leaps to the floor before the fight (the fight screen itself uses battle-enemy-scavenger). Drawn facing left; the game mirrors it as needed.'); break;
    case 'battle-portrait': lines.push(e.id === 'battle-hero' ? 'The fight screen\'s Mara (left side), facing right.' : 'Shown on the fight screen on the right, facing left towards Mara.'); break;
    case 'battle-backdrop': lines.push('The fight screen\'s backdrop: the fighters stand on its lower third, the cards cover the bottom.'); break;
    case 'prop': lines.push(e.id.startsWith('creature-') ? 'The creature\'s small sprite in the room: it comes out of the grate, the pipe or the pit, hops towards Mara, then the fight starts.' : 'A moving part the game draws over the room (it swings or turns it).'); break;
    case 'item': lines.push('A satchel item: shown in the inventory bar and on the cursor while it is being used.'); break;
    case 'pack': lines.push(e.phase === 1
      ? 'Phase 1 of Silas\'s articulated pack (art/LAYERED-RIG.md): the standing figure every other piece is cut from. The user approves it before anything of Phase 2 is made.'
      : 'Phase 2 of Silas\'s articulated pack (art/LAYERED-RIG.md), made from the approved Phase 1 master: the game rigs his walk, kneeling and lying from these pieces (as for Mara), and draws his masks over him in every pose.'); break;
    case 'icon': lines.push('An action-ring icon (the verbs that appear around a clicked thing).'); break;
    case 'card': lines.push('A card picture on the fight screen, shown at about 120 px in the hand and larger when looked at.'); break;
    case 'map': lines.push("The world map in the notebook's Map tab, shown about 480 px wide. The game writes each known place's name next to its mark and pins where the character is, so the painting has no lettering at all."); break;
    case 'equipment': lines.push(`A gear picture on the gear screen (the paper doll's slot and the loot-style preview). Tier ${e.tier ?? 1} of 10: keep the same silhouette, framing and angle as the other tiers of this piece.`); break;
    default: break;
  }
  return lines;
}

// ------------------------------------------------------------------------ technical ---
function technical(e: ArtEntry): string[] {
  if (e.spec) return e.kind === 'pack' && !e.redo ? [`File: \`art/inbox/${e.pack}/${e.piece}.png\`.`, ...e.spec] : e.spec;
  switch (e.kind) {
    case 'room': return [`File: \`art/inbox/${e.id}.png\`, opaque, 16:9 (1280×720 or larger). No people. It is fitted to 1280×720, reduced to the 2-pixel grid and snapped to the palette.`, `Layout to follow: \`art/spec/${e.file.split('/').pop()!.replace('.png', '.jpg')}\`.`];
    case 'battle-backdrop': return [`File: \`art/inbox/${e.id}.png\`, opaque, 1280×720 or larger at 16:9; the floor clear in the lower third.`];
    case 'object': return [`Files: ${e.tags!.map(t => `\`art/inbox/${e.id}-${t}.png\``).join(', ')}: transparent (or on flat magenta #FF00FF), the thing standing on the bottom edge.`, `Fitted into a ${e.frame?.w ?? '?'}×${e.frame?.h ?? '?'} art-pixel frame (true proportion to Mara at 232), reduced to the 2-pixel grid, outlined.`];
    case 'character': case 'extra': return [`Folder: \`art/inbox/${e.id}/\` with four required pictures, transparent (or flat magenta): \`body.png\` (standing, everything but the working arm) and \`arm.png\` (the working arm, a little overlap at the shoulder), both 1024×1536 on the same canvas; \`kneel.png\` (the whole figure down on one knee, facing right, as when looking at something low; 1024×1536, the same scale, knee and foot on y ≈ 1500); \`lie.png\` (the whole figure lying on the back, head to the right, eyes closed; 1536×1024 landscape, the same scale, lying on y ≈ 990)${e.kind === 'extra' ? '; and \`sit.png\` if they sit at work (the same canvas as body.png)' : (RIGS as Record<string, { sits?: string }>)[e.rig ?? '']?.sits === 'asleep' ? '; and \`sit.png\` (required: asleep sitting on a plain wooden chair seen side-on, facing right, chin dropped on the chest, eyes closed, hands in the lap; draw the chair too, the seat about 48 px high in the game; the same canvas and scale as body.png, feet on y ≈ 1500)' : ''}.`, `Pose: full body facing right in a slight three-quarter turn, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500${e.height && e.height < 180 ? ' (a child: about 63% of an adult\'s height on the same feet line)' : ', head top at y ≈ 40'}. Face lit, eyes open, mouth closed, neutral.`];
    case 'portrait': return ['Made by the game from the character\'s drawing: no separate picture.'];
    case 'card-atlas': return ['Assembled by the importer from the nine card pictures: no separate picture.'];
    case 'foreground': return ['Cut by the importer from the room painting: no separate picture.'];
    case 'card': return [`File: \`art/inbox/${e.id}.png\`, 256×256, opaque, the motif centred and readable at 120 px.`];
    case 'map': return [`File: \`art/inbox/${e.id}.png\`, 1000×700 (or larger at the same 10:7), opaque parchment. No text.`, 'Layout to follow: `art/spec/world-map.png` (every place where its mark is; the names there are only for you).'];
    case 'equipment': return [`File: \`art/inbox/${e.id}.png\`, 320×320, transparent (or flat magenta), the piece centred, seen from the front, filling about 80% of the square.`];
    case 'item': return [`File: \`art/inbox/${e.id}.png\`, 64×64, transparent (or flat magenta), the thing filling the tile.`];
    case 'icon': return [`File: \`art/inbox/${e.id}.png\`, 48×48, transparent (or flat magenta), a simple bold symbol.`];
    case 'battle': case 'battle-portrait': return [`File: \`art/inbox/${e.id}.png\`, transparent (or flat magenta), standing on the bottom edge${e.height ? `, ${e.height} px tall (the figure about 60% of that, standing 4% above the bottom)` : e.width ? `, about ${e.width} px wide` : ''}. Reduced to the 2-pixel grid.`];
    case 'prop': return [`File: \`art/inbox/${e.id}.png\`, transparent (or flat magenta), anchored at its ${e.anchor === 'top-centre' ? 'top' : e.anchor === 'centre' ? 'centre' : 'bottom'} edge${e.height ? `, ${e.height} px tall` : ''}. Reduced to the 2-pixel grid.`];
    default: return [`File: \`art/inbox/${e.id}.png\`.`];
  }
}

function brief(e: ArtEntry): string {
  const kept = e.kind === 'pack' ? `kept in \`art/sources/characters/${e.pack}/${e.piece}.png\`` : `in the game as \`art/src/${e.file}\``;
  const lines: string[] = [`# ${e.id}`, '', `Status: **${e.status}** · ${e.kind} · chapter ${e.chapter} · ${kept}`, ''];
  if (e.builtFrom) {
    lines.push(`Built by the game from the \`${e.builtFrom}\` pack (see "Silas, a main character" in art/CODEX.md): nothing to make for this one alone.`, '');
    return lines.join('\n');
  }
  if (['portrait', 'card-atlas', 'foreground'].includes(e.kind) || e.id === 'room-tent') {
    lines.push(e.id === 'room-tent' ? 'The tent is the reference picture itself (`tent-reference.png`): nothing to make.' : technical(e)[0], '');
    return lines.join('\n');
  }
  lines.push('## What the game does with it', '', ...functional(e), '', '## Technical', '', ...technical(e).map(t => `- ${t}`), '');
  lines.push('## Prompt for Codex', '', '```text', `Draw for the game The Rift: Ashlands: ${e.subject}`);
  if (e.light) lines.push(`Light sources in this place: ${e.light}`);
  const room = e.kind === 'room' || e.kind === 'battle-backdrop';
  lines.push(...STYLE, room ? FLAT : 'Proportions: true to the cast (art/style/scale.png): Mara is 232 px, a doorway about 328, a table top 104, a chair seat 48.', room ? ROOM_LIGHT : EVEN);
  if (e.kind === 'battle-portrait' && e.id !== 'battle-hero') lines.push('Facing left (it stands on the right of the fight).');
  if (e.kind === 'character' || e.kind === 'extra') lines.push('Facing right in a slight three-quarter turn (the game mirrors it to face left).');
  if (e.kind === 'pack') lines.push('Facing right (the game mirrors it to face left). Same look as Mara\'s pack: the same line, shading, pixel density and palette.');
  for (const t of technical(e)) lines.push(t.replace(/`/g, ''));
  lines.push('```', '', '## Attach', '', '- `tent-reference.png` (the look to match), `art/STYLE.md`, `art/style/palette.png`, `art/style/scale.png`');
  if (e.kind === 'room') lines.push(`- \`art/spec/${e.file.split('/').pop()!.replace('.png', '.jpg')}\` (the layout to follow)`);
  if (e.kind === 'map') lines.push('- `art/spec/world-map.png` (the layout to follow)');
  if (e.kind === 'equipment') lines.push(`- the other tiers of this piece already made (\`art/src/kc/equipment/\`), to keep them consistent`);
  if (e.kind === 'pack') {
    lines.push('- `art/sources/characters/mara-casual-layered/` (Mara\'s pack: the format to match, piece by piece) and `art/LAYERED-RIG.md` (the pack contract)');
    if (e.twoSided) lines.push(`- \`art/sources/characters/${e.pack}/\` (this outfit facing right: the look to match, piece by piece) and \`art/inbox/sigrid-layered/\` with its \`left/\` folder (a two-sided pack: the format)`);
    if (e.twoSided && e.phase === 2) lines.push(`- the approved \`art/sources/characters/${e.pack}/left/master.png\` and \`idle.png\` (approved by the user on 2026-11-09: keep the fuller waist and lower torso exactly)`);
    else if (e.redo) lines.push(`- \`art/sources/characters/${e.pack}/idle.png\` (the current pose, to redraw relaxed) and \`master.png\``);
    else if (e.phase === 2) lines.push(`- the approved Phase 1 pictures: \`art/inbox/${e.pack}/master.png\` and \`idle.png\``);
    lines.push('', '## Then', '', `Save it as \`art/inbox/${e.pack}/${e.redo ? `${e.piece}-relaxed` : e.piece}.png\`. Do **not** run \`npm run art:import\` for this folder: Claude brings it into \`art/sources/characters/${e.pack}/\`, measures its joints (rig.json) and rigs it. Report which pieces are in.`, '');
    return lines.join('\n');
  }
  lines.push('', '## Then', '', `\`npm run art:import\`, look at \`art/inbox/preview/${e.id}.png\`, \`npm run art:check\`.`);
  if (e.kind === 'character' || e.kind === 'extra') lines.push('', 'After import its layers are in `art/sources/characters/`: the joints and face are measured once in `art/manifest.mjs` (RIGS), then `npm run rig` (this step is for Claude, not Codex).');
  lines.push('');
  return lines.join('\n');
}

for (const e of MANIFEST) writeFileSync(join(out, `${e.id}.md`), brief(e));

const index = ['# Codex briefs', '', `Style bible: [art/STYLE.md](../STYLE.md) · palette: ${palette.length} colours ([palette.png](../style/palette.png)) · scale: [scale.png](../style/scale.png) · order: [art/CODEX.md](../CODEX.md).`, '',
  'Start with the [pilot pack](PILOT.md). Generated by `npm run art:briefs` from art/manifest.mjs and art/descriptions.mjs.', '', '| Asset | Kind | Chapter | Status |', '| --- | --- | --- | --- |',
  ...MANIFEST.map(e => `| [${e.id}](${e.id}.md) | ${e.kind} | ${e.chapter} | ${e.status} |`), ''];
writeFileSync(join(out, 'INDEX.md'), index.join('\n'));
const pilot = ['# Pilot pack', '', 'A small style test before the full set. Make these, bring them in with `npm run art:import`, and stop: the user looks at them in the game before the rest is made.', '',
  ...PILOT.map(id => `- [${id}](${id}.md)`), ''];
writeFileSync(join(out, 'PILOT.md'), pilot.join('\n'));
// ------------------------------------------------------------------------ CODEX.md ---
// The one file Codex follows: setup, the rules, the pilot pack (then stop), then every picture in
// batches, room by room (each room, then what stands in it and who is seen there), then the fight
// screen, cards, gear, items and icons. Generated, so it always matches the manifest.
const MAKES = (e: ArtEntry) => !['portrait', 'card-atlas', 'foreground'].includes(e.kind) && e.id !== 'room-tent' && !e.builtFrom;
/** Already in the new style: imported by Codex since the reference (the older Gemini backdrop is redone too). */
/** A rigged character's source folder (art/sources/characters/<id>/), once the rig builds from Codex's drawing. */
const sourceDir = (e: ArtEntry) => {
  const rig = e.rig ? (RIGS as Record<string, { source: string; variant?: unknown }>)[e.rig] : undefined;
  // A recoloured stand-in borrows another character's drawing: its own art is still to make.
  if (rig?.variant) return null;
  const src = rig?.source;
  if (src?.startsWith('sources/')) return join(art, dirname(src));
  // Background people and casual Mara are rigged straight from their own folder.
  const own = join(art, 'sources', 'characters', e.id);
  return (e.kind === 'character' || e.kind === 'extra') && existsSync(join(own, 'body.png')) ? own : null;
};
/** The required character pictures still missing from its source folder. */
const missingPoses = (e: ArtEntry) => { const dir = sourceDir(e); return dir ? ['kneel.png', 'lie.png'].filter(f => !existsSync(join(dir, f))) : []; };
const DONE = (e: ArtEntry) => (e.kind === 'pack' && !e.redo && existsSync(join(art, 'sources', 'characters', e.pack!, `${e.piece}.png`)))
  || (e.status === 'final' && e.id !== 'battle-backdrop-gallery')
  // A character is done once its rig builds from Codex's drawing with all its poses (rigged sheets stay generated, not 'final').
  || (!!sourceDir(e) && !missingPoses(e).length);
const byId = new Map(MANIFEST.map(e => [e.id, e]));
const output = (e: ArtEntry) => e.kind === 'pack' ? `art/inbox/${e.pack}/${e.redo ? `${e.piece}-relaxed` : e.piece}.png`
  : e.builtFrom ? `nothing to make: built from the ${e.builtFrom} pack`
  : e.kind === 'object' ? e.tags!.map(t => `art/inbox/${e.id}-${t}.png`).join(', ')
  // A sheet built from another character's drawing (the lit-gauntlet Mara) needs no pictures of its own.
  : sourceDir(e) && basename(sourceDir(e)!) !== e.id ? `nothing to make: built from ${basename(sourceDir(e)!)}'s drawing`
  : sourceDir(e) && missingPoses(e).length ? `${missingPoses(e).map(f => `art/inbox/${e.id}/${f}`).join(', ')} (only these: body and arm are in)`
  : e.kind === 'character' || e.kind === 'extra' ? `art/inbox/${e.id}/body.png, arm.png, kneel.png, lie.png${(RIGS as Record<string, { sits?: string }>)[e.rig ?? '']?.sits ? ', sit.png' : ''}` : `art/inbox/${e.id}.png`;
const line = (e: ArtEntry) => `- [${DONE(e) ? 'x' : ' '}] **${e.id}**: [brief](briefs/${e.id}.md) → \`${output(e)}\``;
const listed = new Set<string>(PILOT);
// Silas, a main character: his pack in two phases (its own section below), and the sheets built from it.
const packLines = (phase: 1 | 2, pack = 'silas-layered') => MANIFEST.filter(e => e.kind === 'pack' && e.pack === pack && e.phase === phase && !e.twoSided && !e.redo).map(e => { listed.add(e.id); return line(e); });
// Changes asked after delivery: Mara's left-facing sets (two-sided, like Sigrid) and Silas's relaxed idle.
const leftLines = (phase: 1 | 2) => MANIFEST.filter(e => e.twoSided && e.phase === phase).map(e => { listed.add(e.id); return line(e); });
const changes = [
  '## Changes to delivered characters',
  '',
  '### Mara facing left (two-sided, like Sigrid)',
  '',
  'The game has been mirroring Mara to face left, which moves his gauntlet from his right arm to his left (and his scarf end and satchel to the wrong side). Like Sigrid\'s pack (`art/inbox/sigrid-layered/` and its `left/` folder), each of his three outfits (`mara-light-layered`, `mara-medium-layered`, `mara-casual-layered` in `art/sources/characters/`) gets a left-facing set, drawn on its own and never mirrored: the same file names in a `left/` folder. Facing left, what is on his right side (the gauntlet, the cord bracelet) is on the FAR side, and what is on his left (the scarf end, the satchel) is on the NEAR side. Attach each outfit\'s right-facing pack as the look to match. Save in `art/inbox/<pack>/left/` and do not import: Claude brings them in and rigs them.',
  '',
  '#### First: the three left-facing standing figures, then stop',
  '',
  'Make the left-facing `master.png` and `idle.png` of each outfit, and **stop**: the user approves them before the rest.',
  '',
  ...leftLines(1),
  '',
  '#### Then: walking, kneeling and lying facing left (the standing figures are approved)',
  '',
  'The user approved the six left-facing standing drawings on 2026-11-09; they are now in `art/sources/characters/<pack>/left/`. Cut and draw everything below from those approved masters, for all three outfits. Keep the fuller waist and lower torso the user asked for (see `art/inbox/mara-left-review/HANDOFF.md`): do not slim the waist in the layers.',
  '',
  ...leftLines(2),
  '',
  '### Silas: a more relaxed standing picture',
  '',
  'His standing picture (`idle.png`) has a hand raised in the air; redraw it relaxed, the hand down. Save it as `art/inbox/silas-layered/idle-relaxed.png` (do not import): Claude swaps it in.',
  '',
  ...MANIFEST.filter(e => e.redo).map(e => { listed.add(e.id); return line(e); }),
  '',
];
const sigrid = [
  '## Sigrid, a main character (like Mara)',
  '',
  'Captain Sigrid gets the same articulated pack (`art/LAYERED-RIG.md`): one outfit, 228 art px tall, fit and athletic like Mara, a sword only (no shield). Save every piece in `art/inbox/sigrid-layered/` and do not import that folder: Claude brings it in and rigs it.',
  '',
  '### Phase 1: the standing figure, then stop',
  '',
  'Make these two, and **stop**: the user looks at them and approves Sigrid\'s look before Phase 2.',
  '',
  ...packLines(1, 'sigrid-layered'),
  '',
  '### Phase 2: walking, kneeling and lying (after Phase 1 is approved)',
  '',
  'Everything here is cut from the approved master, on its canvas and coordinates.',
  '',
  ...packLines(2, 'sigrid-layered'),
  '',
  `Then the game builds ${MANIFEST.filter(e => e.builtFrom === 'sigrid-layered').map(e => `\`${e.id}\``).join(', ')} from the pack: nothing to make for those.`,
  '',
];
const silas = [
  '## Silas, a main character (like Mara)',
  '',
  'Silas gets an articulated pack like Mara\'s (`art/LAYERED-RIG.md`, `art/sources/characters/mara-casual-layered/`): one outfit, 220 art px tall. Save every piece in `art/inbox/silas-layered/` and do not import that folder: Claude brings it in and rigs it.',
  '',
  '### Phase 1: the standing figure, then stop',
  '',
  'Make these two, and **stop**: the user looks at them and approves Silas\'s look before Phase 2.',
  '',
  ...packLines(1),
  '',
  '### Phase 2: walking, kneeling, lying and his masks (after Phase 1 is approved)',
  '',
  'Everything here is cut from or drawn over the approved master, on its canvas and coordinates.',
  '',
  ...packLines(2),
  '',
  `Then the game builds ${MANIFEST.filter(e => e.builtFrom === 'silas-layered').map(e => `\`${e.id}\``).join(', ')} from the pack: nothing to make for those.`,
  '',
];
const batch = (title: string, ids: string[]) => {
  const items = ids.map(id => byId.get(id)).filter((e): e is ArtEntry => !!e && MAKES(e) && !listed.has(e.id));
  items.forEach(e => listed.add(e.id));
  return items.length ? [`### ${title}`, '', ...items.map(line), ''] : [];
};
const sections: string[] = [];
for (const c of CHAPTERS) {
  sections.push(c.id === 'intro' ? '## The intro (Silas)' : `## Chapter ${c.id.slice(2)}`, '');
  for (const room of Object.values(c.rooms)) {
    const ids = [room.background, ...room.objects.map(o => o.sheet), ...(room.props ?? []).flatMap(p => ('image' in p ? [`prop-${p.image}`] : [])),
      ...room.actors.map(a => `char-${a.id}`), ...(CROWDS[room.id]?.extras.map(x => x.sheet) ?? [])];
    if (room.id === 'tent') ids.push('char-mara', 'char-mara-gauntlet', 'char-mara-casual', 'item-gauntlet', 'item-notebook');
    if (room.id === 'gallery') ids.push('battle-scavenger', 'item-regulator');
    if (room.id === 'firingHouse') ids.push('item-bread', 'item-scarf');
    if (room.id === 'tunnelCollapse') ids.push('item-rag');
    if (room.id === 'workshop') ids.push('battle-enemy-rig', 'battle-backdrop-workshop');
    sections.push(...batch(`${name(`room.${room.id}`)} (\`${room.id}\`)`, ids));
  }
  if (c.id === 'ch2') sections.push(...batch('The tunnel creatures', MANIFEST.filter(e => e.id.startsWith('creature-') || (e.chapter === 'ch2' && e.kind === 'battle-portrait')).map(e => e.id)));
}
sections.push('## The fight screen', '', ...batch('Mara, the enemies and the backdrops', MANIFEST.filter(e => e.kind.startsWith('battle')).map(e => e.id)));
sections.push('## Cards', '', ...batch('The nine cards (the importer assembles the card atlas when all nine are in)', MANIFEST.filter(e => e.kind === 'card').map(e => e.id)));
sections.push('## Gear, ten tiers each', '');
for (const id of Object.keys(Object.fromEntries(MANIFEST.filter(e => e.kind === 'equipment').map(e => [e.id.replace(/^equipment-/, '').replace(/-t\d+$/, ''), 1])))) {
  sections.push(...batch(`${id} (make tier 1 first, then 2 to 10 keeping the same silhouette and framing)`, MANIFEST.filter(e => e.id === `equipment-${id}` || e.id.startsWith(`equipment-${id}-t`)).sort((a, b) => (a.tier ?? 1) - (b.tier ?? 1)).map(e => e.id)));
}
sections.push("## The notebook's world map", '', ...batch('One painting (the game writes the names)', MANIFEST.filter(e => e.kind === 'map').map(e => e.id)));
sections.push('## Satchel items and action icons', '', ...batch('Items', MANIFEST.filter(e => e.kind === 'item').map(e => e.id)), ...batch('Icons', MANIFEST.filter(e => e.kind === 'icon').map(e => e.id)));
const leftovers = MANIFEST.filter(e => MAKES(e) && !listed.has(e.id));
if (leftovers.length) sections.push('## Anything else', '', ...leftovers.map(line), '');

const codex = [
  '# The Rift: Ashlands art: instructions for Codex',
  '',
  `Generated by \`npm run art:briefs\` (scripts/art-briefs.ts) from the art manifest: ${[...listed].length} pictures to make. Work through this file top to bottom and tick each line as it lands in the game.`,
  '',
  '## Before you start',
  '',
  '1. Look at `tent-reference.png` (in `adventure/`): it is the look of the whole game, and it is already in the game as Mara\'s tent.',
  '2. Read `art/STYLE.md` (the style bible: flat 2D staging, proportions, the pixel grid, colour, light, formats).',
  '3. Keep these open: `art/style/palette.png` (the colours), `art/style/scale.png` (everyone\'s heights), and for each room its layout image `art/spec/<room>.jpg`.',
  '',
  '## For every picture',
  '',
  '1. Open its brief (the link in its line below). It has three parts: what the game does with it, the technical requirements, and the prompt to paint from. Use the prompt, attach what the brief lists, and follow the technical part exactly.',
  '2. Save the result as the exact file name in its line, in `art/inbox/`: `<id>.png`; objects one file per state `<id>-<state>.png`; characters a folder `<id>/` with `body.png`, `arm.png`, `kneel.png` and `lie.png` (all four required; keep the feet inside the canvas); a main character\'s pack pieces in its pack folder (`silas-layered/<piece>.png`). Transparent background, or flat magenta `#FF00FF` where transparency is impossible.',
  '3. After each batch, from `adventure/`: `npm run art:import` (fits each picture to size, reduces it to the 2-pixel grid, snaps it to the palette, outlines sprites, puts it where the game loads it, marks it final, writes a before/after preview), then `npm run art:check`.',
  '4. Look at `art/inbox/preview/<id>.png` for each one. If it does not match the brief (wrong layout, wrong proportions, text in it, a person in a room, perspective), make it again under the same name and import again.',
  '5. Characters: after import their layers are kept in `art/sources/characters/`; Claude measures the joints and rigs them (`npm run rig`). Note them in your report.',
  '',
  '## Never',
  '',
  '- Change any file name, or anything outside `art/inbox/` (no game code, no manifest, no rooms).',
  '- Put people in room paintings, text in any picture, or perspective in a room.',
  '- Paint glow pools, light shafts, haze or particles: the game adds them.',
  '',
  '## 1. The pilot pack: then stop',
  '',
  'Make these first, import them, and **stop**: the user looks at them in the game and approves the style before anything else is made.',
  '',
  ...PILOT.map(id => byId.get(id)).filter((e): e is ArtEntry => !!e && MAKES(e)).map(line),
  '',
  ...changes,
  ...silas,
  ...sigrid,
  '## 2. Everything else, in batches (after the pilot is approved)',
  '',
  ...sections,
];
writeFileSync(join(art, 'CODEX.md'), codex.join('\n'));
console.log(`Wrote ${MANIFEST.length} briefs to art/briefs (INDEX.md, PILOT.md) and art/CODEX.md (${[...listed].length} pictures to make).`);
