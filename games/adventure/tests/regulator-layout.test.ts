import test from 'node:test';
import assert from 'node:assert/strict';
import { fitRegulatorBoard } from '../src/ui/regulatorLayout';
import { readFileSync } from 'node:fs';
import { ROOMS } from '../src/chapters/ch1/rooms';
import { PNG } from 'pngjs';

test('regulator close-up reuses the painted gauge and solid installed centre instead of procedural substitutes',()=>{
 const source=readFileSync(new URL('../src/ui/regulator.ts',import.meta.url),'utf8');
 assert.match(source,/import gaugeFace from '\.\.\/\.\.\/art\/src\/props\/gauge-face\.png'/,'the painted gallery gauge is loaded');
 assert.match(source,/import cartridge from '\.\.\/\.\.\/art\/src\/props\/regulator-closeup-center\.png'/,'the solid installed centre is loaded');
 assert.match(source,/<img class="pressure-face"[^>]*src="\$\{gaugeFace\}"/,'the gauge image is actually rendered');
 assert.doesNotMatch(source,/regulator-cartridge[^\n]*(?:hidden|ringReleased)/,'unlocking the ring never hides the centre before lift-out');
 const css=readFileSync(new URL('../src/ui/regulator.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/repeating-conic-gradient/,'no CSS-drawn replacement dial obscures the painting');
});

test('removable close-up centre retains opaque brass source pixels and transparent backing',()=>{
 // Cut from the socket drawing installed before the C7 gallery redraw, kept as its source.
 const source=PNG.sync.read(readFileSync(new URL('../art/sources/regulator-closeup/socket-pre-c7.png',import.meta.url)));
 const centre=PNG.sync.read(readFileSync(new URL('../art/src/props/regulator-closeup-center.png',import.meta.url)));
 assert.deepEqual([centre.width,centre.height],[80,80]);
 assert.equal(centre.data[(40*80+40)*4+3],255,'the former black hole has an opaque brass centre');
 assert.equal(centre.data[3],0,'outside the removable circular cap stays transparent');
 let retained=0;
 for(let y=0;y<80;y++)for(let x=0;x<80;x++){
  const pixel=(y*80+x)*4;
  if(!centre.data[pixel+3])continue;
  const original=((y+36)*source.width+x+40)*4;
  assert.deepEqual(centre.data.subarray(pixel,pixel+4),source.data.subarray(original,original+4));
  retained++;
 }
 assert.ok(retained>3500,'a complete substantial cap is present, rather than a hollow rim');
});

test('regulator illustration fits resized desktop windows without distortion',()=>{
 for(const [width,height] of [[700,410],[280,220],[380,160],[180,95],[120,50]]){
  const board=fitRegulatorBoard(width,height);
  assert.ok(board.width<=width&&board.height<=height,'illustration never causes overflow');
  assert.ok(Math.abs(board.width/board.height-1.6)<0.001,'mechanisms retain their alignment');
 }
});
test('gallery gauge face, needle and click target share the painted socket centre',()=>{
 const gauge=ROOMS.gallery.props!.find(p=>p.kind==='gauge')!;
 // C7 gallery r2 registration: gauge centre (804,86) art pixels (art/sources/gallery-c7/approval.json).
 assert.deepEqual([gauge.x*2,gauge.y*2],[804,86]);
 const target=ROOMS.gallery.hotspots.find(h=>h.id==='gauge')!;
 const xs=target.polygon.map(p=>p.x),ys=target.polygon.map(p=>p.y);
 assert.deepEqual([(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],[402,43]);
});

test('close-up dial stays centred on its painted socket as the board scales',()=>{
 const css=readFileSync(new URL('../src/ui/regulator.css',import.meta.url),'utf8');
 const declarations=css.match(/\.pressure-dial\{([^}]+)\}/)![1];
 const property=(name:string)=>declarations.match(new RegExp(`(?:^|;)${name}:([^;]+)`))?.[1];
 for(const [width,height] of [[512,320],[700,437.5],[280,175],[180,112.5]]){
  // The game's global * rule already uses border-box; the local rule makes it explicit.
  const diameter=width*parseFloat(property('width')!)/100;
  const translated=property('transform')==='translate(-50%,-50%)';
  const centreX=width*parseFloat(property('left')!)/100+(translated?0:diameter/2);
  const centreY=height*parseFloat(property('top')!)/100+(translated?0:diameter/2);
  // Measured painted socket (256,43) in the 512x320 housing, including its outer border.
  assert.ok(Math.abs(centreX-width/2)<0.01,`dial is horizontally centred at board width ${width}`);
  assert.ok(Math.abs(centreY-height*43/320)<0.01,`dial is vertically centred at board width ${width}`);
 }
});

test('close-up pressure needle rotates about the dial centre in high and safe states',()=>{
 const css=readFileSync(new URL('../src/ui/regulator.css',import.meta.url),'utf8');
 const needle=css.match(/\.pressure-needle\{([^}]+)\}/)![1];
 const property=(name:string)=>needle.match(new RegExp(`(?:^|;)${name}:([^;]+)`))?.[1];
 const [originX,originY]=property('transform-origin')!.split(' ').map(parseFloat);
 const translate=property('transform')!.match(/translate\(([-\d.]+)%,([-\d.]+)%\)/)!;
 for(const dialContent of [52.32,26.8,15.8]){
  const height=dialContent*parseFloat(property('height')!)/100;
  const pivotX=dialContent*parseFloat(property('left')!)/100+3*(originX+Number(translate[1]))/100;
  const pivotY=dialContent*parseFloat(property('top')!)/100+height*(originY+Number(translate[2]))/100;
  assert.ok(Math.abs(pivotX-dialContent/2)<0.001);
  assert.ok(Math.abs(pivotY-dialContent/2)<0.001);
 }
 assert.match(property('transform')!,/rotate\(65deg\)/);
 const safe=css.match(/\[data-stage="ring"\] \.pressure-needle,\[data-stage="done"\] \.pressure-needle\{([^}]+)\}/)![1];
 assert.match(safe,/translate\(-50%,-100%\) rotate\(-65deg\)/);
});
