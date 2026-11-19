import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { auditBrowserSuites, auditNodeSuites, discover, FEATURES, selectBrowserCases, selectNodeTests, validateFeatures } from './test-suites.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const testRoot = join(root, 'tests');
const mode = process.argv[2] ?? 'fast';
const args = process.argv.slice(3);
const list = args.includes('--list');
const features = [...new Set(args.filter(arg => arg !== '--list'))];

function child(args, { capture = false } = {}) {
  return new Promise((resolve, reject) => {
    // Always use the current Node and local tool entrypoints, without shell/glob interpretation.
    const env = { ...process.env };
    if (capture) for (const key of ['PLAYWRIGHT_JSON_OUTPUT_FILE', 'PLAYWRIGHT_JSON_OUTPUT_NAME', 'PLAYWRIGHT_JSON_OUTPUT_DIR']) delete env[key];
    const p = spawn(process.execPath, args, { cwd: root, env, stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit', windowsHide: true });
    let stdout = '';
    if (capture) p.stdout.on('data', chunk => { stdout += chunk; });
    p.on('error', reject);
    p.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(`Command failed (${code}): node ${args.join(' ')}${capture && stdout ? '\n' + stdout.slice(-3000) : ''}`)));
  });
}

async function timed(label, action) {
  const start = performance.now();
  const result = await action();
  const seconds = (performance.now() - start) / 1000;
  console.log(`${label}: ${seconds.toFixed(2)}s`);
  return result;
}

function nodeInventory() {
  const files = discover(testRoot, /\.test\.(?:[cm]?[jt]s|[jt]sx)$/);
  auditNodeSuites(files);
  return files;
}

async function typecheck() {
  const pkg = require.resolve('typescript/package.json');
  const bin = JSON.parse(readFileSync(pkg, 'utf8')).bin.tsc;
  await timed('Typecheck', () => child([resolve(dirname(pkg), bin), '--noEmit']));
}

async function nodeTests(kind, selectedFeatures = []) {
  const files = selectNodeTests(nodeInventory(), kind, selectedFeatures);
  console.log(`Node ${kind}: ${files.length} files${selectedFeatures.length ? ' (' + selectedFeatures.join(', ') + ')' : ''}`);
  if (list) { for (const file of files) console.log(`  ${file}`); return; }
  await timed(`Node ${kind}`, () => child([require.resolve('tsx/cli'), '--test', ...files.map(f => join(testRoot, f))]));
}

async function browserInventory() {
  const report = JSON.parse(await child([require.resolve('@playwright/test/cli'), 'test', '--list', '--reporter=json'], { capture: true }));
  return auditBrowserSuites(report, discover(join(testRoot, 'e2e'), /\.spec\.(?:[cm]?[jt]s|[jt]sx)$/));
}

async function productionBuild() {
  await timed('Production build + verification', async () => {
    for (const script of ['kc-css.mjs', 'publish.mjs', 'verify-build.mjs']) await child([join(root, 'scripts', script)]);
  });
}

async function browsers(selectedFeatures = null, cases = null) {
  cases ??= await browserInventory();
  const selected = selectedFeatures ? selectBrowserCases(cases, selectedFeatures) : cases;
  console.log(`Browser ${selectedFeatures ? 'focused' : 'all'}: ${selected.length} checks`);
  if (list) { for (const c of selected) console.log(`  [${c.project}] ${c.title} ${c.tags.join(' ')}`); return; }
  const grep = selectedFeatures ? ['--grep', `(?=.*@focused)(?=.*@(?:${selectedFeatures.join('|')})\\b)`] : [];
  await timed(`Browser ${selectedFeatures ? 'focused' : 'all'}`, () => child([require.resolve('@playwright/test/cli'), 'test', ...grep]));
}

async function main() {
  if (!['fast', 'feature', 'browser', 'all', 'check', 'build', 'e2e', 'release', 'inventory'].includes(mode)) throw new Error(`Unknown test command: ${mode}`);
  if (mode === 'feature' || mode === 'browser') validateFeatures(features);
  else if (features.length) throw new Error(`${mode} takes no features. Available features: ${FEATURES.join(', ')}`);
  if (mode === 'build') { if (!list) { await typecheck(); await productionBuild(); } return; }
  const files = nodeInventory();
  if (mode === 'inventory') {
    const cases = await browserInventory();
    console.log(`Inventory valid: ${files.length} Node files (${selectNodeTests(files, 'fast').length} fast); ${cases.length} browser checks (${cases.filter(c => c.tags.includes('@focused')).length} focused, ${cases.filter(c => c.tags.includes('@journey')).length} journeys).`);
    if (list) { await nodeTests('all'); await browsers(null, cases); }
    return;
  }
  if (mode === 'browser' || mode === 'e2e') {
    const cases = await browserInventory();
    // Fail unknown/empty selection before spending time on typecheck and build.
    if (mode === 'browser') selectBrowserCases(cases, features);
    if (!list) { await typecheck(); await productionBuild(); }
    await browsers(mode === 'browser' ? features : null, cases);
    return;
  }
  const cases = mode === 'release' ? await browserInventory() : null;
  if (!list) await typecheck();
  await nodeTests(mode === 'fast' ? 'fast' : mode === 'feature' ? 'feature' : 'all', features);
  if (!list && (mode === 'check' || mode === 'release')) await productionBuild();
  if (mode === 'release') await browsers(null, cases);
}

const started = performance.now();
try {
  await main();
  const total = (performance.now() - started) / 1000;
  console.log(`Total ${mode}: ${total.toFixed(2)}s${mode === 'fast' && !list ? ' (target ~30s; timing is informational)' : ''}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
