import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { auditBrowserSuites, auditNodeSuites, selectBrowserCases, selectNodeTests, validateFeatures } from '../scripts/test-suites.mjs';

const catalog = {
  'logic.test.ts': { fast: true, features: ['story', 'saves'] },
  'pixels.test.ts': { fast: false, features: ['art'] },
};
const files = Object.keys(catalog);
const spec = (file, tags, projectName = 'desktop') => ({ title: file, file, tags, tests: [{ projectName, expectedStatus: 'passed' }] });
const report = (...specs) => ({ suites: [{ suites: [{ specs }] }] });

test('fast selection excludes expensive modules; features form a deduplicated union', () => {
  assert.deepEqual(selectNodeTests(files, 'fast', [], catalog), ['logic.test.ts']);
  assert.deepEqual(selectNodeTests(files, 'feature', ['story', 'saves'], catalog), ['logic.test.ts']);
  assert.deepEqual(selectNodeTests(files, 'all', [], catalog), files);
  assert.throws(() => validateFeatures(['typo']), /Unknown feature/);
  assert.throws(() => validateFeatures([]), /at least one/);
});

test('new or stale Node test classifications fail instead of silently losing coverage', () => {
  assert.throws(() => auditNodeSuites([...files, 'new.test.ts'], catalog), /Unclassified Node test/);
  assert.throws(() => auditNodeSuites(['logic.test.ts'], catalog), /no test file/);
});

test('browser inventory catches missing chapter files, untagged cases and wrong devices', () => {
  const valid = report(spec('playthrough.spec.ts', ['@focused', '@story']), spec('debug-chapter2.spec.ts', ['@journey', '@runtime']));
  assert.equal(auditBrowserSuites(valid, ['playthrough.spec.ts', 'debug-chapter2.spec.ts']).length, 2);
  assert.throws(() => auditBrowserSuites(report(valid.suites[0].suites[0].specs[0]), ['playthrough.spec.ts', 'debug-chapter2.spec.ts']), /omitted from discovery/);
  assert.throws(() => auditBrowserSuites(report(spec('x.spec.ts', [])), ['x.spec.ts']), /choose exactly one/);
  assert.throws(() => auditBrowserSuites(report(spec('x.spec.ts', ['@focused', '@phone', '@input'])), ['x.spec.ts']), /wrong device/);
  assert.throws(() => auditBrowserSuites(report(spec('x.spec.ts', ['@focused', '@input', '@typo'])), ['x.spec.ts']), /unknown tag/);
});

test('focused browser selection never includes long journeys from the same file', () => {
  const cases = auditBrowserSuites(report(spec('mixed.spec.ts', ['@focused', '@story']), spec('mixed.spec.ts', ['@journey', '@story']), spec('mobile.spec.ts', ['@focused', '@input', '@phone'], 'phone')), ['mixed.spec.ts', 'mobile.spec.ts']);
  assert.equal(selectBrowserCases(cases, ['story']).length, 1);
  assert.equal(selectBrowserCases(cases, ['input'])[0].project, 'phone');
  assert.throws(() => selectBrowserCases(cases, ['saves']), /No focused browser/);
});

test('browser inventory normalizes JSON reporter tags without changing CLI tag matching', () => {
  const cases = auditBrowserSuites(report(spec('mobile.spec.ts', ['focused', 'input', 'phone'], 'phone')), ['mobile.spec.ts']);
  assert.equal(selectBrowserCases(cases, ['input']).length, 1);
});

test('selection CLI rejects unknown or absent features before it can build', () => {
  const cli = fileURLToPath(new URL('../scripts/tests.mjs', import.meta.url));
  for (const args of [['browser', 'typo'], ['feature'], ['unknown-command']]) {
    const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.doesNotMatch(result.stdout, /Production build/);
  }
});

test('listing a fast selection does not run tests or touch the published artifact', () => {
  const cli = fileURLToPath(new URL('../scripts/tests.mjs', import.meta.url));
  const page = new URL('../index.html', import.meta.url);
  const before = readFileSync(page);
  const result = spawnSync(process.execPath, [cli, 'fast', '--list'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /game\.test\.ts/);
  assert.doesNotMatch(result.stdout, /layered-rig\.test\.ts|Production build|Typecheck:/);
  assert.deepEqual(readFileSync(page), before);
});
