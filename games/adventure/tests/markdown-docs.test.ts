import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateFullBriefs, runArtBriefs } from '../scripts/art-briefs';
import { generateArtGuide, runArtGuide } from '../scripts/art-guide';
import { renderReference, writeReferences, type ReferenceSpec } from '../scripts/art-reference';

const root = fileURLToPath(new URL('..', import.meta.url));
function scratch(t: { after(fn: () => void): void }) {
  const dir = mkdtempSync(join(tmpdir(), 'markdown-docs-'));
  t.after(() => {
    const rel = relative(resolve(tmpdir()), resolve(dir));
    assert.ok(rel.startsWith('markdown-docs-') && !rel.startsWith('..') && !isAbsolute(rel));
    rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}
const list = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? list(join(dir, e.name)) : [join(dir, e.name)]);

test('Markdown-only catalog and guide generation leave non-Markdown outputs untouched', async t => {
  const dir = scratch(t), image = join(dir, 'untouched.png');
  writeFileSync(image, 'original binary sentinel');
  const files = await generateFullBriefs({ outputDir: dir, markdownOnly: true });
  assert.ok(files.size > 500);
  assert.ok([...files.keys()].every(f => f.endsWith('.md')));
  const guide = await generateArtGuide({ outputDir: dir, markdownOnly: true });
  assert.deepEqual([...guide.keys()], [join(dir, 'REPLACING.md')]);
  assert.ok(list(dir).filter(f => !f.endsWith('.md')).every(f => f === image));
  assert.equal(readFileSync(image, 'utf8'), 'original binary sentinel');
  await generateFullBriefs({ outputDir: dir, markdownOnly: true, check: true });
  await generateArtGuide({ outputDir: dir, markdownOnly: true, check: true });
  const index = join(dir, 'briefs/INDEX.md');
  writeFileSync(index, 'edited');
  await assert.rejects(generateFullBriefs({ outputDir: dir, markdownOnly: true, check: true }), /Stale generated references/);
  assert.equal(readFileSync(index, 'utf8'), 'edited');
  await assert.rejects(runArtGuide(['--check']), /requires --markdown-only/);
  await assert.rejects(runArtBriefs(['--private-spec', 'private/kofi1/spec.json', '--markdown-only', '--out-dir', dir]), /only supported/);
});

test('nested chapter Markdown preserves asset contracts and resolves canonical guide links', () => {
  const description = 'Unique fixture description.';
  const spec: ReferenceSpec = { id: 'fixture', title: 'Fixture', private: true,
    hero: { name: 'Worker', height: 220 }, rules: ['Unique chapter exception.'],
    rooms: [{ id: 'workshop', title: 'Workshop', description: 'A workshop.', background: 'A plain wall.', stages: [{ id: 'ready', description: 'Ready.' }] }],
    assets: [{ id: 'stand', title: 'Stand', kind: 'object', classification: 'visual', width: 80, height: 120,
      description, states: [{ id: 'idle', description: 'Still.', condition: 'Always.' }],
      placements: [{ id: 'stand-place', room: 'workshop', x: 240, y: 600, layer: 'world', stages: ['ready'] }] }],
  };
  const outputDir = join(root, 'private/fixture/reference');
  const files = renderReference(spec, { rootDir: root, outputDir, markdownOnly: true });
  assert.ok([...files.keys()].every(f => f.endsWith('.md')));
  const asset = files.get(join(outputDir, 'objects/stand.md')) as string;
  assert.equal(asset.split(description).length - 1, 1);
  assert.match(asset, /80×120/);
  assert.match(asset, /\(240,600\).*world/);
  assert.match(asset, /\*\*idle\*\*.*Always/);
  const link = asset.match(/\[art\/PIPELINE.md\]\(([^)]+)\)/)?.[1];
  assert.ok(link);
  assert.equal(resolve(outputDir, 'objects', link), resolve(root, 'art/PIPELINE.md'));
  assert.ok(!(files.get(join(outputDir, 'INDEX.md')) as string).includes('Unique chapter exception.'));
  assert.ok((files.get(join(outputDir, 'DRAWING-RULES.md')) as string).includes('Unique chapter exception.'));
});

test('Markdown-only writer does not check or write entries of other types', t => {
  const dir = scratch(t), md = join(dir, 'contract.md'), png = join(dir, 'untouched.png');
  writeFileSync(png, 'keep');
  const files = new Map<string, string | Uint8Array>([[md, '# Contract\n'], [png, new Uint8Array([1, 2])]]);
  writeReferences(files, { markdownOnly: true });
  writeReferences(files, { markdownOnly: true, check: true });
  assert.equal(readFileSync(png, 'utf8'), 'keep');
});
