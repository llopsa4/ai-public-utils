// Writes a Codex brief per asset (art/briefs/<id>.md) from the art manifest and the style bible,
// plus art/briefs/INDEX.md (everything, with status) and art/briefs/PILOT.md (the style test).
//
//   npm run art:briefs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFEST, PILOT, RIGS } from '../art/manifest.mjs';
import type { ArtEntry } from '../art/manifest.mjs';

const art = join(dirname(fileURLToPath(import.meta.url)), '..', 'art');
const out = join(art, 'briefs');
mkdirSync(out, { recursive: true });
const palette: string[] = JSON.parse(readFileSync(join(art, 'style', 'palette.json'), 'utf8')).colours;

const STYLE = [
  'Style: painterly pixel art. Painted forms, worn materials and soft light falloff, finished as pixel art with crisp edges (no blur or haze around shapes) and a limited palette.',
  'World: an industrial-fantasy village inside an old kiln: fired clay, ceramic plates, iron, brass, soot, ash, ochre cloth, ember light. Lived-in and repaired.',
  "Colour: keep to the attached master palette (art/style/palette.png, 160 colours: ochres, rust, brass, ember orange, clay; soot greys and iron blue-greys). Every pixel is snapped to it on import.",
  'Do not paint glows, haze, light shafts, particles or text: the game adds them. No photographic detail, lens effects, neon or modern objects.',
];
const ROOM_LIGHT = 'Light: warm key light from the fire named above, cool dim fill from the opposite side. Camera at eye level, stage-like three-quarter view; floor in the lower third to two-fifths.';
const SPRITE_LIGHT = 'Light: evenly lit with soft form shading and no strong cast light (the game lights it to match each room). Facing right in three-quarter view unless it is a flat icon.';

function deliver(e: ArtEntry): string[] {
  switch (e.kind) {
    case 'room': return [`Deliver: art/inbox/${e.id}.png, 1280×720 (or larger at 16:9), opaque, no people in it.`, `Composition: keep the layout of art/spec/${e.file.replace('rooms/', '').replace('.png', '.jpg')} (attached): the walkable floor (green), the doorways and every outlined thing must stay where it is shown.`];
    case 'battle-backdrop': return [`Deliver: art/inbox/${e.id}.png, 1280×720, opaque; the floor clear in the lower third (the fighters stand there).`];
    case 'object': return [`Deliver one image per state, each a transparent PNG standing on its bottom edge: ${e.tags!.map(t => `art/inbox/${e.id}-${t}.png`).join(', ')}.`, 'Same size, position and framing in every state; only what changes between states differs.'];
    case 'character': case 'extra': return [
      `Deliver a folder art/inbox/${e.id}/ with layers as transparent PNGs on a 1024×1536 canvas: body.png (everything but the working arm) and arm.png (the working arm, a little overlap at the shoulder). Optional extra views: back.png, sit.png, lie.png.`,
      `Pose: full body, three-quarter view facing right, upright, arms relaxed, feet apart and both visible, feet on y ≈ 1500${e.height && e.height < 180 ? ' (a child: about 63% of an adult\'s height, same feet line)' : ', head top at y ≈ 40'}. Face clearly lit, eyes open, mouth closed, neutral expression.`,
      `Scale in the game: ${e.height} px tall at the front of a room (see art/style/scale.png).`,
    ];
    case 'portrait': return [`Made by the game from the character's drawing (no separate image needed).`];
    case 'card-atlas': return ['Assembled by the importer from the nine card tiles (no separate image needed).'];
    case 'card': return [`Deliver: art/inbox/${e.id}.png, 256×256 square, opaque, the motif centred and readable at 120 px.`];
    case 'battle': case 'battle-portrait': return [`Deliver: art/inbox/${e.id}.png, transparent, standing on the bottom edge, about ${e.width} px wide.`];
    case 'foreground': return [`Cut by the importer from the room painting (no separate image needed).`];
    default: return [`Deliver: art/inbox/${e.id}.png, transparent PNG${e.size ? `, ${e.size.w}×${e.size.h}` : ''}, ${e.anchor === 'bottom-centre' ? 'standing on its bottom edge' : 'centred'}.`];
  }
}

function brief(e: ArtEntry): string {
  const lines: string[] = [`# ${e.id}`, '', `Status: **${e.status}** · ${e.kind} · chapter ${e.chapter} · in the game as \`art/src/${e.file}\``, ''];
  if (['portrait', 'card-atlas', 'foreground'].includes(e.kind)) { lines.push(...deliver(e), ''); return lines.join('\n'); }
  lines.push('## Prompt for Codex', '', '```text');
  lines.push(`Draw for the game Cinderfold: ${e.subject}`);
  if (e.light) lines.push(`Lighting: ${e.light}`);
  lines.push(...STYLE, e.kind === 'room' || e.kind === 'battle-backdrop' ? ROOM_LIGHT : SPRITE_LIGHT, ...deliver(e));
  lines.push('```', '', '## Attach', '', '- `art/STYLE.md` (the style bible) and `art/style/palette.png`');
  if (e.kind === 'room') lines.push(`- \`art/spec/${e.file.replace('rooms/', '').replace('.png', '.jpg')}\` (layout to keep)`);
  if (e.kind === 'character' || e.kind === 'extra') lines.push('- `art/style/scale.png` (heights)');
  lines.push(`- The current placeholder for reference: \`art/src/${e.file}\``);
  if (e.kind === 'character' && e.rig) lines.push('', `After import: re-measure the joints and face for \`${e.rig}\` in art/manifest.mjs (RIGS: hipY, splitX, hips, knees, eyes, face, portrait), then \`npm run rig\`.`);
  lines.push('', `Then: \`npm run art:import\`, check \`art/inbox/preview/${e.id}.png\`, \`npm run art:check\`, and look at it in the game.`, '');
  return lines.join('\n');
}

for (const e of MANIFEST) writeFileSync(join(out, `${e.id}.md`), brief(e));

const index = ['# Codex briefs', '', `Style bible: [art/STYLE.md](../STYLE.md) · palette: ${palette.length} colours ([palette.png](../style/palette.png)) · scale: [scale.png](../style/scale.png).`, '',
  'Start with the [pilot pack](PILOT.md). Generated by `npm run art:briefs` from art/manifest.mjs.', '', '| Asset | Kind | Chapter | Status |', '| --- | --- | --- | --- |',
  ...MANIFEST.map(e => `| [${e.id}](${e.id}.md) | ${e.kind} | ${e.chapter} | ${e.status} |`), ''];
writeFileSync(join(out, 'INDEX.md'), index.join('\n'));
const pilot = ['# Pilot pack', '', 'A small style test before the full set: one room, Mara, one object, one item, one card and the fight enemy. Bring them in with `npm run art:import`, look at them in the game, and adjust art/STYLE.md if they do not sit together.', '',
  ...PILOT.map(id => { const e = MANIFEST.find(m => m.id === id)!; return `- [${id}](${id}.md): ${e.subject}`; }), ''];
writeFileSync(join(out, 'PILOT.md'), pilot.join('\n'));
void RIGS;
console.log(`Wrote ${MANIFEST.length} briefs to art/briefs (INDEX.md, PILOT.md).`);
