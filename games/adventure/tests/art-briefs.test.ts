import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { MANIFEST } from '../art/manifest.mjs';
import type { ArtEntry } from '../art/manifest.mjs';
import { generateFullBriefs, runArtBriefs } from '../scripts/art-briefs';

const root = fileURLToPath(new URL('..', import.meta.url));

function scratch(t: { after(fn: () => void): void }) {
  const dir = mkdtempSync(join(tmpdir(), 'art-briefs-'));
  t.after(() => {
    const rel = relative(resolve(tmpdir()), resolve(dir));
    assert.ok(rel.startsWith('art-briefs-') && !rel.startsWith('..') && !isAbsolute(rel));
    rmSync(dir, { recursive: true, force: true });
  });
  return dir;
}

const fixture = (extra: Partial<ArtEntry> = {}): ArtEntry => ({
  id: 'fixture', kind: 'pack', file: 'unused.png', chapter: 'fixture', status: 'requested',
  generator: 'fixture', anchor: 'none', subject: 'A public-safe fixture.', ...extra,
});

// Exercise the real CLI with writes intercepted: the old generator wrote hundreds of briefs
// before crashing on Kofi source references. This must never touch repository outputs.
test('full art brief generation handles source references without a partial-write crash', () => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    let writes = 0;
    fs.writeFileSync = () => { writes++; };
    fs.mkdirSync = () => undefined;
    syncBuiltinESMExports();
    try {
      const { runArtBriefs } = await import('./scripts/art-briefs.ts');
      await runArtBriefs([]);
      console.log('intercepted writes:', writes);
    } catch (error) {
      console.error('intercepted writes before failure:', writes, error);
      process.exitCode = 1;
    }
  `], { cwd: fileURLToPath(new URL('..', import.meta.url)), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /intercepted writes: [1-9]\d*/);
});

test('invalid pack metadata reports every asset before creating or modifying output', async t => {
  const dir = scratch(t);
  const sentinel = join(dir, 'sentinel.txt');
  writeFileSync(sentinel, 'keep');
  await assert.rejects(generateFullBriefs({ outputDir: dir, manifest: [
    fixture({ id: 'missing-pack', piece: 'body' }), fixture({ id: 'missing-piece', pack: 'hero' }),
    fixture({ id: 'bad-reference', sourceReference: '../outside.png' }),
  ] }), error => {
    assert.match(String(error), /missing-pack: deliverable pack requires/);
    assert.match(String(error), /missing-piece: deliverable pack requires/);
    assert.match(String(error), /bad-reference: sourceReference/);
    return true;
  });
  assert.deepEqual(readdirSync(dir), ['sentinel.txt']);
  assert.equal(readFileSync(sentinel, 'utf8'), 'keep');
});

test('a brief rendering failure leaves existing output unchanged and identifies its asset', async t => {
  const dir = scratch(t);
  writeFileSync(join(dir, 'sentinel.txt'), 'keep');
  const entry = fixture({ kind: 'item' });
  Object.defineProperty(entry, 'subject', { get() { throw new Error('bad visual description'); } });
  await assert.rejects(generateFullBriefs({ outputDir: dir, manifest: [entry] }), /Cannot render art brief fixture: bad visual description/);
  assert.deepEqual(readdirSync(dir), ['sentinel.txt']);
  assert.equal(readFileSync(join(dir, 'sentinel.txt'), 'utf8'), 'keep');
});

test('a late intro-rendering failure does not write already-rendered catalog briefs', async t => {
  const dir = scratch(t);
  const entry = MANIFEST.find(e => e.id === 'room-cell')!;
  const originalSize = entry.size;
  const originalFrame = entry.frame;
  try {
    entry.frame = { w: 0, h: 0 };
    await assert.rejects(generateFullBriefs({ outputDir: dir }), /dimensions|size|positive|frame/i);
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    entry.size = originalSize;
    entry.frame = originalFrame;
  }
});

test('full isolated generation is deterministic, references are non-deliverable, and checks never rewrite', async t => {
  const dir = scratch(t);
  const queues = ['handoff/from-claude.md', 'handoff/from-codex.md', 'WORKLOG.md'].map(file => [join(root, file), readFileSync(join(root, file))] as const);
  const first = await generateFullBriefs({ outputDir: dir });
  assert.ok(first.size > MANIFEST.length);
  assert.ok(existsSync(join(dir, 'briefs/INDEX-intro.md')));
  assert.ok(existsSync(join(dir, 'spec/cell.jpg')));
  assert.equal(existsSync(join(dir, 'CODEX.md')), false);
  const second = await generateFullBriefs({ outputDir: dir });
  assert.deepEqual([...first.keys()], [...second.keys()]);
  for (const [file, content] of first) assert.deepEqual(Buffer.from(content), Buffer.from(second.get(file)!), file);
  await generateFullBriefs({ outputDir: dir, check: true });
  for (const entry of MANIFEST.filter(e => e.sourceReference)) {
    const content = readFileSync(join(dir, 'briefs', `${entry.id}.md`), 'utf8');
    assert.match(content, /Reference only/);
    assert.ok(content.includes(`art/${entry.sourceReference}`));
    assert.doesNotMatch(content, /art\/inbox\/|undefined|in the game as|Status: \*\*final/);
    const catalogLine = readFileSync(join(dir, 'briefs/CATALOG.md'), 'utf8').split('\n').find(line => line.includes(`**${entry.id}**`))!;
    assert.match(catalogLine, /reference only/);
    assert.doesNotMatch(catalogLine, /\[[ x]\]/);
  }
  const index = join(dir, 'briefs/INDEX.md');
  writeFileSync(index, 'changed by hand');
  await assert.rejects(generateFullBriefs({ outputDir: dir, check: true }), /Stale generated references/);
  assert.equal(readFileSync(index, 'utf8'), 'changed by hand');
  for (const [file, before] of queues) assert.deepEqual(readFileSync(file), before, file);
});

test('CLI accepts full catalog check/output options and rejects scoped output overrides before writing', async t => {
  const dir = scratch(t);
  await runArtBriefs(['--out-dir', dir]);
  await runArtBriefs(['--check', '--out-dir', dir]);
  for (const args of [
    ['--chapter', 'intro', '--out-dir', dir],
    ['--private-spec', 'private/kofi1/spec.json', '--out-dir', dir],
    ['--chapter', 'intro', '--private-spec', 'private/kofi1/spec.json'],
    ['--chapter'], ['--out-dir'], ['--unknown'],
  ]) await assert.rejects(runArtBriefs(args), /only supported|Choose exactly|Unknown or incomplete/);
});
