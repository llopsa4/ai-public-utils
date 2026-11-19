import test from 'node:test';
import assert from 'node:assert/strict';
import { MANIFEST } from '../art/manifest.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { renderReference, validateReference, writeReferences, orderedAssets, placementPoint, targetBounds, type ReferenceSpec } from '../scripts/art-reference';
import { privateReferenceLocation } from '../scripts/art-reference-private';

// Public-safe authoring fixture: no unpublished chapter details or local private files required.
function fixture(): ReferenceSpec {
  return { id:'fixture',title:'Reference fixture',private:true,hero:{name:'Worker',height:220},rooms:[{
    id:'workshop',title:'Workshop',description:'A neutral test room.',background:'Plain wall.',
    stages:[{id:'arrival',description:'Tools waiting.'},{id:'installed',description:'Tools attached.'}],
    targets:[{id:'stand',title:'Stand',assetId:'stand',verbs:['use'],bounds:{x:400,y:400,width:100,height:100}}],
  }],assets:[{
    id:'trim',title:'Visual trim',kind:'object',width:20,height:20,description:'Decorative trim.',classification:'visual',states:[{id:'idle',description:'Unchanged.',condition:'Always.'}],
    placements:[{id:'trim-place',room:'workshop',x:100,y:500,layer:'rear',stages:['arrival','installed']}],
  },{
    id:'stand',title:'Stand',kind:'object',width:100,height:100,description:'A sound stand.',classification:'target',interaction:['use'],
    states:[{id:'idle',description:'Ready.',condition:'Always.'}],
    placements:[{id:'stand-place',room:'workshop',x:450,y:500,layer:'world',stages:['arrival','installed']}],
  },{
    id:'screen',title:'Attached screen',kind:'object',width:50,height:20,description:'A small screen.',classification:'target',interaction:['install'],
    states:[{id:'fitted',description:'Attached.',condition:'After installation.'}],
    placements:[{id:'screen-place',room:'workshop',layer:'world',stages:['installed'],parent:{placement:'stand-place',dx:0,dy:-60}}],
  }] };
}

test('one authoring source generates deterministic references in room and puzzle order', () => {
  const spec=fixture(),root=mkdtempSync(join(tmpdir(),'reference-render-')),outputDir=join(root,'private/fixture/reference');
  const options={rootDir:root,outputDir};
  const first=renderReference(spec,options),second=renderReference(spec,options);
  assert.deepEqual(first,second);
  assert.deepEqual(orderedAssets(spec,'workshop').map(a=>a.id),['stand','screen','trim']);
  const brief=first.get(join(outputDir,'objects/trim.md')) as string;
  assert.match(brief,/Visual layer only; no additional interaction/);
  assert.match(first.get(join(outputDir,'INDEX.md')) as string,/GENERATED/);
  assert.deepEqual(placementPoint(spec,spec.assets[2].placements[0]),{x:450,y:440});
});

test('freshness checks detect edited generated files without rewriting them', () => {
  const root=mkdtempSync(join(tmpdir(),'reference-fresh-')),outputDir=join(root,'private/fixture/reference');
  const files=renderReference(fixture(),{rootDir:root,outputDir});
  writeReferences(files);writeReferences(files,{check:true});
  const index=join(outputDir,'INDEX.md');writeFileSync(index,'changed by hand');
  assert.throws(()=>writeReferences(files,{check:true}),/Stale generated references/);
  assert.equal(readFileSync(index,'utf8'),'changed by hand');
});

test('planned target geometry follows the authoritative parent placement after it moves', () => {
  const spec=fixture(),target=spec.rooms[0].targets![0];
  delete target.bounds;target.placement='stand-place';
  spec.assets[1].placements[0].x=600;
  assert.deepEqual(targetBounds(spec,target),{x:550,y:400,width:100,height:100});
  assert.deepEqual(placementPoint(spec,spec.assets[2].placements[0]),{x:600,y:440});
});

test('planned target outlines follow sprite stage visibility instead of leaking future stages', () => {
  const spec=fixture(),target=spec.rooms[0].targets![0];
  target.placement='stand-place';delete target.bounds;
  spec.assets[1].placements[0].stages=['installed'];
  const root=mkdtempSync(join(tmpdir(),'reference-stage-'));
  const files=renderReference(spec,{rootDir:root,outputDir:join(root,'private/fixture/reference')});
  const svg=files.get(join(root,'private/fixture/reference/layouts/workshop.svg')) as string;
  assert.match(svg, /data-target="stand" data-stages="installed" visibility="hidden"/);
});

test('attachments cannot float without their parent and one instance cannot appear twice', () => {
  const orphan=fixture();orphan.assets[0].placements[0].stages=['arrival'];
  orphan.assets[2].placements[0].parent!.placement='trim-place';
  assert.throws(()=>validateReference(orphan),/Attachment visible without parent/);
  const duplicate=fixture();duplicate.assets[1].placements.push({...duplicate.assets[1].placements[0],id:'stand-copy'});
  assert.throws(()=>validateReference(duplicate),/Duplicate instance/);
  const cycle=fixture();cycle.assets[1].placements[0].parent={placement:'screen-place',dx:0,dy:0};
  assert.throws(()=>validateReference(cycle),/Cyclic attachment/);
});

test('private output cannot be generated into public briefs and visual layers cannot gain verbs', () => {
  const root=mkdtempSync(join(tmpdir(),'reference-private-'));
  assert.throws(()=>renderReference(fixture(),{rootDir:root,outputDir:join(root,'art/briefs')}),/Private references/);
  const accidental=fixture();accidental.assets[0].interaction=['look'];
  assert.throws(()=>validateReference(accidental),/Visual-only asset has interactions/);
});

test('scene references validate exact authoring anchors', () => {
  const root=mkdtempSync(join(tmpdir(),'reference-source-'));writeFileSync(join(root,'story.md'),'<a id="fixture-scene"></a>');
  const spec=fixture();spec.assets[0].source=[{file:'story.md',anchor:'fixture-scene'}];
  validateReference(spec,root);
  spec.assets[0].source[0].anchor='missing-scene';
  assert.throws(()=>validateReference(spec,root),/Missing scene anchor/);
});

test('private input and output must be git-ignored before authoring content is consumed', () => {
  const root=mkdtempSync(join(tmpdir(),'reference-ignore-'));
  execFileSync('git',['init','--quiet',root]);
  mkdirSync(join(root,'private/fixture'),{recursive:true});
  const input=join(root,'private/fixture/spec.json');writeFileSync(input,'{}');
  assert.throws(()=>privateReferenceLocation(input,root),/not git-ignored/);
  writeFileSync(join(root,'.gitignore'),'/private/\n');
  assert.equal(privateReferenceLocation(input,root).output,join(root,'private/fixture/reference'));
  writeFileSync(join(root,'public.json'),'{}');
  assert.throws(()=>privateReferenceLocation('public.json',root),/permanent private directory/);
});

test('only the approved Kofi prologue pack may be tracked inside private authoring', () => {
  const root=mkdtempSync(join(tmpdir(),'reference-prologue-'));
  execFileSync('git',['init','--quiet',root]);
  mkdirSync(join(root,'private/kofi1'),{recursive:true});
  const input=join(root,'private/kofi1/spec.json');writeFileSync(input,'{}');
  assert.equal(privateReferenceLocation(input,root).output,join(root,'private/kofi1/reference'));
  const other=join(root,'private/kofi1/whole-story.json');writeFileSync(other,'{}');
  assert.throws(()=>privateReferenceLocation(other,root),/not git-ignored/);
});

test('Silas cell drawing description follows the approved cage and offscreen stairs', () => {
  const cell = MANIFEST.find(e => e.id === 'room-cell')!;
  assert.doesNotMatch(cell.subject, /x 732-812|stone stairs going up/);
  assert.match(cell.subject, /cage/i);
  assert.match(cell.subject, /floor.*(?:wax|tallow)|(?:wax|tallow).*floor/i);
});
