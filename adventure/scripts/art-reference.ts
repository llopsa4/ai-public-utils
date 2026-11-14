/** Documentation model only. Never imported by the game or save migrations. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

export interface ReferenceSource { file: string; anchor?: string }
export interface ReferencePlacement {
  id: string; room: string; x?: number; y?: number; layer: string; stages: string[];
  state?: string; stateByStage?: Record<string, string>; instance?: string; condition?: string;
  parent?: { placement: string; dx: number; dy: number };
}
export interface ReferenceAsset {
  id: string; title: string; kind: string; width: number; height: number;
  anchor?: 'top-left' | 'bottom-centre' | 'none'; description: string;
  classification: 'target' | 'visual' | 'foreground'; interaction?: string[];
  states: { id: string; description: string; condition: string; drawing?: boolean }[];
  placements: ReferencePlacement[]; source?: ReferenceSource[]; notes?: string[];
  icon?: { forms: { id: string; description: string; file?: string }[] };
  files?: Record<string, string>; status?: string;
}
export interface ReferenceRoom {
  id: string; assetId?: string; title: string; description: string; background: string;
  source?: ReferenceSource[]; stages: { id: string; description: string }[];
  targets?: { id: string; title: string; verbs: string[]; bounds?: {x:number;y:number;width:number;height:number}; placement?: string; condition?: string; source?: ReferenceSource; assetId?: string }[];
  backgroundVariants?: { assetId: string; condition: string }[];
  exits?: { label: string; x: number; y: number; description: string }[];
  actors?: { label: string; x: number; y: number; height?: number }[];
  walkable?: { outer: {x:number;y:number}[]; holes: {x:number;y:number}[][] };
  notes?: string[];
}
export interface ReferenceSpec {
  id: string; title: string; private: boolean; storyFile?: string;
  rooms: ReferenceRoom[]; assets: ReferenceAsset[]; rules?: string[];
  hero?: { name: string; height: number }; regeneration?: string;
}
export interface ReferenceOptions { outputDir: string; rootDir: string }
export type ReferenceFiles = Map<string, string | Uint8Array>;
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const slug = (id: string) => { if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error(`Invalid reference id: ${id}`); return id; };
const pathLink = (from: string, to: string) => relative(dirname(from), to).split(sep).join('/');
const inside = (parent: string, child: string) => { const r = relative(resolve(parent), resolve(child)); return r !== '..' && !r.startsWith(`..${sep}`) && !isAbsolute(r); };

export function placementPoint(spec: ReferenceSpec, placement: ReferencePlacement, seen = new Set<string>()): {x:number;y:number} {
  if (seen.has(placement.id)) throw new Error(`Cyclic attachment: ${placement.id}`);
  seen.add(placement.id);
  if (placement.parent) {
    const parent = spec.assets.flatMap(a => a.placements).find(p => p.id === placement.parent!.placement);
    if (!parent || parent.room !== placement.room) throw new Error(`Missing parent in room for ${placement.id}`);
    const point = placementPoint(spec, parent, seen);
    return {x:point.x + placement.parent.dx, y:point.y + placement.parent.dy};
  }
  if (!Number.isFinite(placement.x) || !Number.isFinite(placement.y)) throw new Error(`Missing coordinates: ${placement.id}`);
  return {x:placement.x!, y:placement.y!};
}
export function referenceBounds(spec: ReferenceSpec, asset: ReferenceAsset, p: ReferencePlacement) {
  const point = placementPoint(spec, p);
  return {x:asset.anchor === 'top-left' ? point.x : point.x - asset.width / 2, y:asset.anchor === 'top-left' ? point.y : point.y - asset.height, width:asset.width, height:asset.height};
}
export function targetBounds(spec: ReferenceSpec, target: NonNullable<ReferenceRoom['targets']>[number]) {
  if (target.bounds) return target.bounds;
  for (const asset of spec.assets) {
    const placement=asset.placements.find(p=>p.id===target.placement);
    if (placement) return referenceBounds(spec,asset,placement);
  }
  throw new Error(`Target has no bounds or placement: ${target.id}`);
}

export function validateReference(spec: ReferenceSpec, rootDir?: string): void {
  slug(spec.id);
  const rooms = new Map(spec.rooms.map(r => [r.id, r]));
  if (rooms.size !== spec.rooms.length || !rooms.size) throw new Error('Missing or duplicate rooms');
  const ids = new Set<string>(); const placements = new Map<string, ReferencePlacement>();
  for (const room of spec.rooms) {
    slug(room.id); const stages = room.stages.map(s => slug(s.id));
    if (!stages.length || new Set(stages).size !== stages.length) throw new Error(`Invalid stages: ${room.id}`);
  }
  for (const a of spec.assets) {
    slug(a.id);
    if (ids.has(a.id) || !(a.width > 0 && a.height > 0)) throw new Error(`Duplicate id or invalid frame: ${a.id}`);
    ids.add(a.id);
    if (a.classification !== 'target' && a.interaction?.length) throw new Error(`Visual-only asset has interactions: ${a.id}`);
    const states = new Set(a.states.map(s => s.id));
    if (!states.size || states.size !== a.states.length) throw new Error(`Invalid states: ${a.id}`);
    for (const p of a.placements) {
      if (placements.has(p.id) || !rooms.has(p.room)) throw new Error(`Invalid placement: ${p.id}`);
      placements.set(p.id,p);
      if (p.stages.some(s => !rooms.get(p.room)!.stages.some(t => t.id === s))) throw new Error(`Unknown stage: ${p.id}`);
      if ((p.state && !states.has(p.state)) || Object.values(p.stateByStage ?? {}).some(s => !states.has(s))) throw new Error(`Unknown state: ${p.id}`);
    }
  }
  for (const a of spec.assets) for (const p of a.placements) {
    const b = referenceBounds(spec,a,p);
    if (b.x < 0 || b.y < 0 || b.x + b.width > 1280 || b.y + b.height > 720) throw new Error(`Out-of-frame placement: ${p.id}`);
    if (p.parent && p.stages.some(s => !placements.get(p.parent!.placement)!.stages.includes(s))) throw new Error(`Attachment visible without parent: ${p.id}`);
  }
  for(const room of spec.rooms)for(const target of room.targets??[]) {
    const b=targetBounds(spec,target);
    if(b.x<0||b.y<0||b.x+b.width>1280||b.y+b.height>720)throw new Error(`Out-of-frame target: ${target.id}`);
    if(target.placement&&placements.get(target.placement)?.room!==room.id)throw new Error(`Target placement in wrong room: ${target.id}`);
  }
  for (const room of spec.rooms) for (const stage of room.stages) {
    const seen = new Set<string>();
    for (const a of spec.assets) for (const p of a.placements.filter(p => p.room === room.id && p.stages.includes(stage.id))) {
      const identity = `${a.id}/${p.instance ?? a.id}`;
      if (seen.has(identity)) throw new Error(`Duplicate instance in ${room.id}/${stage.id}: ${identity}`);
      seen.add(identity);
    }
  }
  if (rootDir) for (const source of [...spec.rooms.flatMap(r => r.source ?? []),...spec.assets.flatMap(a => a.source ?? [])]) {
    const file = resolve(rootDir,source.file);
    if (!inside(rootDir,file) || !existsSync(file)) throw new Error(`Missing source: ${source.file}`);
    if (source.anchor && !/^L\d+$/.test(source.anchor) && !readFileSync(file,'utf8').includes(`id="${source.anchor}"`)) throw new Error(`Missing scene anchor: ${source.anchor}`);
  }
}

export function orderedAssets(spec: ReferenceSpec, roomId?: string): ReferenceAsset[] {
  const result: ReferenceAsset[] = []; const used = new Set<string>();
  for (const room of spec.rooms.filter(r => !roomId || r.id === roomId)) {
    const candidates = spec.assets.filter(a => a.kind !== 'room' && a.placements.some(p => p.room === room.id));
    const targets = room.targets?.map(t => t.assetId ?? t.id) ?? [];
    candidates.sort((a,b) => {
      const rank = (x:ReferenceAsset) => x.classification === 'target' ? 0 : x.classification === 'foreground' ? 2 : 1;
      return rank(a)-rank(b) || (targets.indexOf(a.id)<0?999:targets.indexOf(a.id))-(targets.indexOf(b.id)<0?999:targets.indexOf(b.id)) || a.id.localeCompare(b.id);
    });
    for (const a of candidates) if (!used.has(a.id)) { result.push(a);used.add(a.id); }
  }
  if (!roomId) for (const a of [...spec.assets].sort((a,b)=>a.id.localeCompare(b.id))) if (!used.has(a.id) && a.kind !== 'room') { result.push(a);used.add(a.id); }
  return result;
}

/** One layout implementation for runtime and private adapters. SVGs are documentation, not game images. */
export function referenceLayout(spec: ReferenceSpec, room: ReferenceRoom, options: ReferenceOptions): string {
  const assets = orderedAssets(spec,room.id); const height = Math.max(1300,190+assets.length*42);
  const initial = room.stages[0].id; const palette = {target:'#9c571c',visual:'#366b85',foreground:'#784489'};
  const tx = (x:number,y:number,text:string,size=18) => `<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}" fill="#342a20">${esc(text)}</text>`;
  const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="1900" height="${height}" viewBox="0 0 1900 ${height}" role="group" aria-labelledby="title desc"><title id="title">${esc(room.title)} — reference layout</title><desc id="desc">1280 by 720 art-pixel frame. Stage controls select illustrative states; numbers link to asset briefs. Green floor, pink actor scale; targets and visual layers are separate.</desc>`,
    `<style>[role=button]:focus rect{stroke:#315b73;stroke-width:3}</style><rect width="1900" height="${height}" fill="#f8f1e4"/>`,tx(34,38,room.title,28),tx(34,63,'Generated reference · art pixels · diagrams only; source specification owns all placements',16)];
  let bx=34;
  for (const stage of [...room.stages,{id:'all',description:'All overlays'}]) {
    const w=Math.max(78,stage.id.length*9+22);
    svg.push(`<g role="button" tabindex="0" aria-label="Show ${esc(stage.id)}" aria-pressed="${stage.id===initial}" data-button="${esc(stage.id)}" onclick="showStage('${stage.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showStage('${stage.id}')}" ><rect x="${bx}" y="77" width="${w}" height="27" rx="4" fill="${stage.id===initial?'#dfcba8':'#fff9ee'}" stroke="#8d775b"/>${tx(bx+10,96,stage.id,14)}</g>`);bx+=w+7;
  }
  svg.push('<g transform="translate(34 110)"><rect width="1280" height="720" fill="#efe4cf" stroke="#6f5b43"/><rect y="536" width="1280" height="154" fill="#d5dfc9"/><rect y="636" width="1280" height="54" fill="#b7c9a6"/>');
  for(let x=0;x<=1280;x+=80)svg.push(`<path d="M${x} 0 V720" stroke="#bfae95" opacity=".25"/>`);
  for(let y=0;y<=720;y+=80)svg.push(`<path d="M0 ${y} H1280" stroke="#bfae95" opacity=".25"/>`);
  svg.push('<path d="M0 524 H1280 M0 636 H1280 M0 690 H1280" stroke="#77886b" stroke-dasharray="6 6"/>');
  if(room.walkable) {
    const poly=(pts:{x:number;y:number}[])=>pts.map(p=>`${p.x},${p.y}`).join(' ');
    svg.push(`<polygon points="${poly(room.walkable.outer)}" fill="#6c9f73" fill-opacity=".1" stroke="#497650"/>`);
    for(const hole of room.walkable.holes)svg.push(`<polygon points="${poly(hole)}" fill="#c14e44" fill-opacity=".1" stroke="#a74740"/>`);
  }
  for(const t of room.targets??[]){
    const b=targetBounds(spec,t);
    const stages=t.placement?spec.assets.flatMap(a=>a.placements).find(p=>p.id===t.placement)!.stages:room.stages.map(s=>s.id);
    svg.push(`<g data-target="${esc(t.id)}" data-stages="${esc(stages.join(' '))}" visibility="${stages.includes(initial)?'visible':'hidden'}"><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#b39125" stroke-dasharray="3 5"><title>${esc(t.title)}: ${esc(t.verbs.join(', '))}</title></rect></g>`);
  }
  for(const [i,a] of assets.entries())for(const p of a.placements.filter(p=>p.room===room.id)) {
    const b=referenceBounds(spec,a,p),pt=placementPoint(spec,p),col=palette[a.classification];
    const file=spec.private?join(options.outputDir,'objects',`${a.id}.md`):join(options.outputDir,`${a.id}.md`);
    const svgFile=spec.private?join(options.outputDir,'layouts',`${room.id}.svg`):join(options.rootDir,'art/spec',`${room.id}.svg`);
    svg.push(`<g data-stages="${esc(p.stages.join(' '))}" visibility="${p.stages.includes(initial)?'visible':'hidden'}"><a href="${esc(pathLink(svgFile,file))}"><title>${esc(a.title)}; ${esc(p.condition??p.stages.join(', '))}; ${esc(p.id)}</title><rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="${col}" fill-opacity=".07" stroke="${col}" stroke-dasharray="${a.classification==='target'?'0':'5 3'}"/><path d="M${pt.x-4} ${pt.y} h8 M${pt.x} ${pt.y-4} v8" stroke="${col}"/><circle cx="${Math.max(13,b.x+11)}" cy="${Math.max(13,b.y+12)}" r="11" fill="#fff9ee" stroke="${col}"/>${tx(Math.max(6,b.x+5),Math.max(17,b.y+17),String(i+1),12)}</a></g>`);
  }
  const hero=spec.hero??{name:'Viewpoint',height:224};
  const stand=room.actors?.[0]??{x:640,y:670};
  svg.push(`<rect x="${stand.x-26}" y="${stand.y-hero.height}" width="52" height="${hero.height}" rx="22" fill="#bc5a8a" fill-opacity=".15" stroke="#a14878"/>`);
  for(const exit of room.exits??[])svg.push(tx(exit.x<640?12:1040,exit.y-15,exit.label,16));
  svg.push('</g>',tx(1350,113,'OBJECT KEY · room and puzzle order',20),tx(1350,141,'T target · V visual-only · F foreground',15));
  for(const [i,a] of assets.entries()){svg.push(tx(1350,170+i*42,`${i+1} ${a.classification[0].toUpperCase()} · ${a.title}`.slice(0,58),18));svg.push(tx(1370,187+i*42,a.placements.filter(p=>p.room===room.id).flatMap(p=>p.stages).filter((s,i,all)=>all.indexOf(s)===i).join(' / ').slice(0,65),12));}
  svg.push(tx(34,866,`${hero.name}: ${hero.height} art px / ${hero.height/2} logical units. Background stays fixed; props and stages are independent.`,18),tx(34,898,'Click a stage to view one snapshot; All shows alternative footprints, not a simultaneous scene.',18));
  let y=940;
  for(const s of room.stages)for(const line of wrap(`${s.id}: ${s.description}`,108)){svg.push(tx(34,y,line,17));y+=24;}
  svg.push(`<script><![CDATA[function showStage(stage){document.querySelectorAll('[data-stages]').forEach(function(g){g.setAttribute('visibility',stage==='all'||g.getAttribute('data-stages').split(' ').indexOf(stage)>=0?'visible':'hidden')});document.querySelectorAll('[data-button]').forEach(function(g){var selected=g.getAttribute('data-button')===stage;g.querySelector('rect').setAttribute('fill',selected?'#dfcba8':'#fff9ee');g.setAttribute('aria-pressed',selected?'true':'false')})}]]></script></svg>`);
  return svg.join('\n').replace(`height="${height}" viewBox="0 0 1900 ${height}"`,`height="${Math.max(height,y+40)}" viewBox="0 0 1900 ${Math.max(height,y+40)}"`);
}
function wrap(s:string,n:number):string[]{const out:string[]=[];let line='';for(const word of s.split(' ')){if(line.length+word.length>n){out.push(line);line='';}line+=(line?' ':'')+word;}if(line)out.push(line);return out;}

export function renderReference(spec: ReferenceSpec, options: ReferenceOptions): ReferenceFiles {
  validateReference(spec,options.rootDir);
  if(spec.private&&!inside(join(options.rootDir,'private'),options.outputDir))throw new Error('Private references must remain under the private directory');
  const files:ReferenceFiles=new Map();
  const index=join(options.outputDir,spec.private?'INDEX.md':`INDEX-${spec.id}.md`);
  const assetFile=(a:ReferenceAsset)=>join(options.outputDir,spec.private?(a.kind==='item'?'items':'objects'):'',`${a.id}.md`);
  const roomFile=(r:ReferenceRoom)=>join(options.outputDir,spec.private?'rooms':'',`${spec.private?r.id:r.assetId??`room-${r.id}`}.md`);
  const layoutFile=(r:ReferenceRoom)=>spec.private?join(options.outputDir,'layouts',`${r.id}.svg`):join(options.rootDir,'art/spec',`${r.id}.svg`);
  const sources=(from:string,refs:ReferenceSource[]=[])=>(refs.map(s=>`[${s.file}${s.anchor?` · ${s.anchor}`:''}](${pathLink(from,resolve(options.rootDir,s.file))}${s.anchor?`#${s.anchor}`:''})`).join(' · ')||'Visual-only layer; see linked room and its scene sources.');
  const styleReferences=(from:string)=>sources(from,['art/STYLE.md','art/style/palette.png','art/style/scale.png','tent-reference.png'].filter(file=>existsSync(join(options.rootDir,file))).map(file=>({file})));
  const header=(title:string)=>`# ${title}\n\n<!-- GENERATED: edit the authoritative source, then run ${spec.regeneration??'npm run art:briefs'}. -->\n\n${spec.private?'Authoring reference; may contain chapter spoilers. Runtime implementation is separate.':'Reference for the implemented chapter; existing artwork is preserved.'}\n\n`;
  const assetLink=(from:string,a:ReferenceAsset)=>`[${a.title}](${pathLink(from,assetFile(a))})`;
  const byId=new Map(spec.assets.map(a=>[a.id,a]));
  for(const r of spec.rooms){
    const file=roomFile(r),assets=orderedAssets(spec,r.id);
    let md=header(`Room: ${r.title}`)+`## Description\n\n${r.description}\n\n## What the game does with it\n\n${r.stages.map(s=>`- **${s.id}** — ${s.description}`).join('\n')}\n\nSource: ${sources(file,r.source)}\n\n## Fixed background\n\n${r.background}\n\n## Interactive targets — puzzle order\n\n`;
    md+=(r.targets?.map(t=>{const b=targetBounds(spec,t);return `- **${t.title}** (${t.id}): ${t.verbs.join(', ')}. Bounds (${b.x},${b.y}), ${b.width}×${b.height} art px.${t.condition?` When: ${t.condition}.`:''}${t.assetId&&byId.has(t.assetId)?` ${assetLink(file,byId.get(t.assetId)!)}.`:''}`;}).join('\n')||'No interactive targets in this room.')+'\n\n';
    if(r.backgroundVariants?.length)md+='## Conditional background variants\n\n'+r.backgroundVariants.map(v=>`- ${byId.has(v.assetId)?assetLink(file,byId.get(v.assetId)!):v.assetId}: ${v.condition}`).join('\n')+'\n\n';
    for(const classification of ['target','visual','foreground'] as const){md+=`## ${classification==='target'?'Sprites used by targets':classification==='visual'?'Separate visual-only objects and changing scenery':'Foreground layers'}\n\n`;md+=assets.filter(a=>a.classification===classification).map(a=>`- ${assetLink(file,a)} — ${a.width}×${a.height} art px. ${a.placements.filter(p=>p.room===r.id).map(p=>{const pt=placementPoint(spec,p);return `Anchor (${pt.x},${pt.y}), ${p.layer}; ${p.condition??p.stages.join(', ')}.`;}).join(' ')}`).join('\n')||'None.';md+='\n\n';}
    md+=`## Walking space, exits and staging\n\nCoordinates are art pixels; divide by two for logical units. Default floor band y=536–690. ${r.notes?.join('\n\n')??''}\n\n${r.exits?.map(e=>`- **${e.label}** at (${e.x},${e.y}): ${e.description}`).join('\n')??''}\n\n${r.actors?.map(a=>`- ${a.label}: feet (${a.x},${a.y}); reference only.`).join('\n')??''}\n\n## Technical\n\n1280×720 room frame, 2-pixel world grid, existing palette. [Annotated layout](${pathLink(file,layoutFile(r))}). No labels, actors or removable props baked into background. Preserve approved exceptions recorded in the room description.\n\n## Prompt for Codex\n\n${r.description}\n\nPaint only this fixed setting: ${r.background} Follow the linked layout, existing style and references. Lighting/text are runtime effects. No art production is authorised by generating this brief.\n\n## Attach / references\n\n${sources(file,r.source)} · [Chapter index](${pathLink(file,index)})\n`;
    md+=`\nStyle attachments: ${styleReferences(file)}\n`;
    files.set(file,md);files.set(layoutFile(r),referenceLayout(spec,r,options));
  }
  for(const a of spec.assets){
    if(a.kind==='room'&&spec.rooms.some(r=>r.assetId===a.id))continue;
    const file=assetFile(a);let md=header(a.title)+`ID: \`${a.id}\` · ${a.kind} · **${a.classification}**${a.status?` · ${a.status}`:''}\n\n## Description\n\n${a.description}\n\n## What the game does with it\n\n${a.classification==='target'?a.interaction?.join('; ')||'See linked room targets.':'Visual layer only; no additional interaction is introduced.'}\n\n## Placement and layers\n\n`;
    md+=a.placements.map(p=>{const pt=placementPoint(spec,p);const r=spec.rooms.find(r=>r.id===p.room)!;return `- [${r.title}](${pathLink(file,roomFile(r))}): anchor (${pt.x},${pt.y}) art px / (${pt.x/2},${pt.y/2}) logical; ${p.layer}; ${p.condition??p.stages.join(', ')}.${p.parent?` Attached to ${p.parent.placement}, offset (${p.parent.dx},${p.parent.dy}).`:''}${p.stateByStage?` Stage forms: ${Object.entries(p.stateByStage).map(([k,v])=>`${k} → ${v}`).join('; ')}.`:''}`;}).join('\n')||'Inventory, character or shared reference; no freestanding room instance.';
    md+=`\n\n## States, visibility and transitions\n\n${a.states.map(s=>`- **${s.id}** — ${s.description} When: ${s.condition}.${s.drawing===false?' Reuse existing artwork or hide the instance; no separate drawing.':''}`).join('\n')}\n\n${a.notes?.join('\n\n')??''}\n\n## Technical\n\n- Canvas: **${a.width}×${a.height} art px**. ${a.anchor==='top-left'?'Top-left':a.anchor==='none'?'Image tile':'Bottom-centre'} anchor; preserve dimensions and registration across states.\n- Existing palette and world pixel grid; inventory icons use 64×64 transparent tiles.\n- ${a.files?`Files: ${Object.values(a.files).map(f=>`\`${f}\``).join(', ')}.`:'Hidden/collected instances need no blank PNG.'}\n\n## Prompt for Codex\n\n${a.description} Match the exact frame, state descriptions and attachment registration above. Follow the existing style reference. Preserve separate props and actors; no lettering, baked light pools or background in transparent object assets. This reference does not request new art.\n\n## Attach / references\n\n${sources(file,a.source)} · [Chapter index](${pathLink(file,index)})\n`;
    md+=`\nStyle attachments: ${styleReferences(file)}\n`;
    files.set(file,md);
    if(a.icon){const f=join(options.outputDir,'items',`${a.id}.md`);files.set(f,header(`Inventory icon: ${a.title}`)+`## What the game does with it\n\n[World object, source scenes and disappearance rules](${pathLink(f,file)}). The icon replaces the room instance while carried.\n\n## Description\n\n${a.description}\n\n## Technical\n\n64×64, transparent, same silhouette/material identity, no text or border. Draw only these carried forms:\n\n${a.icon.forms.map(s=>`- **${s.id}**: ${s.description}${s.file?` File: \`${s.file}\`.`:''}`).join('\n')}\n\n## Prompt for Codex\n\nDraw the named carried forms at icon scale, following the linked world brief. No installed-state, hidden-state or extra prop images. Production waits for a separate request.\n\n## Attach / references\n\n${sources(f,a.source)} · [Index](${pathLink(f,index)})\n`);}
  }
  let md=header(spec.title)+`Regenerate: \`${spec.regeneration??'npm run art:briefs'}\`. Check freshness by adding \`--check\`.\n\n## Rooms — story order\n\n`;
  for(const r of spec.rooms){md+=`### [${r.title}](${pathLink(index,roomFile(r))})\n\n[Layout](${pathLink(index,layoutFile(r))}) · ${sources(index,r.source)}\n\n`;md+=orderedAssets(spec,r.id).map(a=>`- ${assetLink(index,a)} · ${a.classification}${a.placements.some(p=>p.room!==r.id)?' · shared; one brief':''}`).join('\n')+'\n\n';}
  md+='## Inventory icons\n\n'+spec.assets.filter(a=>a.icon||a.kind==='item').map(a=>`- [${a.title}](${pathLink(index,a.icon?join(options.outputDir,'items',`${a.id}.md`):assetFile(a))})`).join('\n');
  const unplaced=orderedAssets(spec).filter(a=>!a.placements.length&&a.kind!=='item');
  if(unplaced.length)md+='\n\n## Other chapter assets\n\n'+unplaced.map(a=>`- ${assetLink(index,a)}`).join('\n');
  md+='\n\n## Rules and validation\n\n'+(spec.rules?.map(r=>`- ${r}`).join('\n')??'Keep gameplay and art production separate from reference regeneration.')+'\n';
  files.set(index,md);
  const rulesFile=join(options.outputDir,spec.private?'DRAWING-RULES.md':`RULES-${spec.id}.md`);
  files.set(rulesFile,header('Drawing rules')+`Coordinates: 1280×720 art px = 640×360 logical units. Respect each asset’s anchor; foreground cuts may be top-left. A picked-up object hides its room instance; an installed object hides its inventory copy. State frames retain registration. Semantic-only changes reuse the same drawing.\n\n${spec.rules?.map(r=>`- ${r}`).join('\n\n')??''}\n\nAuthoritative sources: ${spec.private?'private spec.json for visual facts; linked STORY.md scenes for narrative and dialogue.':'implemented chapter definitions, manifest and existing sprite metadata.'} Generated files are not edited directly.\n`);
  const coverage=join(options.outputDir,spec.private?'COVERAGE.md':`COVERAGE-${spec.id}.md`);
  files.set(coverage,header('Source coverage')+spec.assets.map(a=>`- ${assetLink(coverage,a)}: ${sources(coverage,a.source)}; ${a.classification}; ${a.placements.length} placement(s).`).join('\n')+'\n\nFreshness, frame bounds, source anchors, stages, identity uniqueness and parent presence are checked by the generator. Narrative correctness and final art still require review. Existing game tests do not execute unbuilt chapters.\n');
  const preview=join(options.outputDir,spec.private?'PREVIEW.html':`PREVIEW-${spec.id}.html`);
  files.set(preview,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(spec.title)} reference</title><style>body{font-family:Georgia,serif;color:#342a20;background:#f8f1e4;margin:30px}h1{font-size:34px}nav{display:flex;gap:20px;flex-wrap:wrap;position:sticky;top:0;background:#fff9ee;padding:16px}a{color:#774420}a:focus-visible{outline:3px solid #315b73}section{margin-top:32px}object{width:100%;height:1000px;border:1px solid #bca88c;background:#f8f1e4}@media(max-width:700px){body{margin:12px}}</style><h1>${esc(spec.title)}</h1><p>Generated reference only. <a href="${esc(pathLink(preview,index))}">Chapter index</a>. Open a full sheet for its stage controls.</p><nav>${spec.rooms.map(r=>`<a href="#${r.id}">${esc(r.title)}</a>`).join('')}</nav>${spec.rooms.map(r=>`<section id="${r.id}"><h2>${esc(r.title)}</h2><a href="${esc(pathLink(preview,layoutFile(r)))}">Full layout</a><object type="image/svg+xml" data="${esc(pathLink(preview,layoutFile(r)))}" aria-label="${esc(r.title)} reference"></object></section>`).join('')}</html>`);
  return files;
}

export function writeReferences(files: ReferenceFiles, options: {check?:boolean} = {}): void {
  const stale:string[]=[];
  for(const [file,content] of files){const expected=Buffer.from(content);if(options.check){if(!existsSync(file)||!readFileSync(file).equals(expected))stale.push(file);}else{mkdirSync(dirname(file),{recursive:true});writeFileSync(file,expected);}}
  if(stale.length)throw new Error(`Stale generated references (${stale.length}):\n${stale.slice(0,10).join('\n')}`);
}
