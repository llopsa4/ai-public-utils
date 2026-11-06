import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

export const FEATURES = ['story', 'saves', 'crowd', 'input', 'art', 'runtime'];
const entry = (fast, ...features) => ({ fast, features });

// Every Node test is discovered independently. This catalog selects subsets, never the full suite.
export const NODE_SUITES = {
  'art-contracts.test.ts': entry(true, 'art', 'runtime'),
  'art-pipeline.test.ts': entry(false, 'art'),
  'art.test.ts': entry(false, 'art'),
  'autosave-hints.test.ts': entry(true, 'story', 'saves', 'runtime'),
  'ch2-tunnels.test.ts': entry(true, 'story'),
  'combat.test.ts': entry(true, 'story', 'runtime'),
  'crowd.test.ts': entry(true, 'crowd'),
  'flavour-secrets.test.ts': entry(true, 'story'),
  'game.test.ts': entry(true, 'story', 'runtime'),
  'layered-rig.test.ts': entry(false, 'art'),
  'lighting-visual.test.ts': entry(true, 'art', 'runtime'),
  'mara-gear-reward.test.ts': entry(true, 'story', 'saves'),
  'mara-idle-unlock.test.ts': entry(false, 'art'),
  'movement.test.ts': entry(true, 'input', 'runtime'),
  'objectives-settings.test.ts': entry(true, 'story', 'input'),
  'pathfinding.test.ts': entry(true, 'crowd', 'input', 'runtime'),
  'rules-golden.test.ts': entry(false, 'story', 'runtime'),
  'save-i18n.test.ts': entry(true, 'story', 'saves'),
  'saves-chapters.test.ts': entry(true, 'story', 'saves', 'runtime'),
  'story-driver.test.ts': entry(true, 'story', 'runtime'),
  'story-graph.test.ts': entry(false, 'story', 'runtime'),
  'story.test.ts': entry(true, 'story', 'runtime'),
  'test-suites.test.mjs': entry(true, 'runtime'),
};

export function discover(root, pattern) {
  const files = [];
  function walk(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) walk(path);
      else if (pattern.test(item.name)) files.push(relative(root, path).replaceAll('\\', '/'));
    }
  }
  walk(root);
  return files.sort();
}

export function validateFeatures(features) {
  if (!features.length) throw new Error(`Choose at least one feature: ${FEATURES.join(', ')}`);
  for (const feature of features) if (!FEATURES.includes(feature)) throw new Error(`Unknown feature: ${feature}. Choose ${FEATURES.join(', ')}`);
  return [...new Set(features)];
}

export function auditNodeSuites(files, catalog = NODE_SUITES) {
  const errors = [];
  for (const file of files) if (!catalog[file]) errors.push(`Unclassified Node test: ${file}`);
  for (const [file, suite] of Object.entries(catalog)) {
    if (!files.includes(file)) errors.push(`Catalog entry has no test file: ${file}`);
    if (typeof suite.fast !== 'boolean' || !suite.features?.length || suite.features.some(f => !FEATURES.includes(f))) errors.push(`Invalid suite classification: ${file}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
}

export function selectNodeTests(files, mode, features = [], catalog = NODE_SUITES) {
  auditNodeSuites(files, catalog);
  if (mode === 'all') return [...files];
  if (mode === 'fast') return files.filter(file => catalog[file].fast);
  if (mode !== 'feature') throw new Error(`Unknown Node suite mode: ${mode}`);
  validateFeatures(features);
  return files.filter(file => catalog[file].features.some(f => features.includes(f)));
}

export function browserCases(report) {
  const cases = [];
  function walk(suite) {
    for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) {
      // Playwright's JSON reporter omits '@'; title/grep matching retains it.
      cases.push({ title: spec.title, file: spec.file.replaceAll('\\', '/').replace(/^.*\/tests\/e2e\//, ''), project: test.projectName, tags: [...new Set((spec.tags ?? []).map(t => t.startsWith('@') ? t : `@${t}`))], expectedStatus: test.expectedStatus });
    }
    for (const child of suite.suites ?? []) walk(child);
  }
  for (const suite of report.suites ?? []) walk(suite);
  return cases;
}

export function auditBrowserSuites(report, files) {
  const cases = browserCases(report);
  const errors = [...(report.errors ?? []).map(e => e.message ?? String(e))];
  for (const file of files) if (!cases.some(c => c.file === file)) errors.push(`Browser spec omitted from discovery: ${file}`);
  if (!cases.length) errors.push('No browser tests discovered');
  for (const c of cases) {
    const label = `${c.project}: ${c.file}: ${c.title}`;
    const tiers = c.tags.filter(t => t === '@focused' || t === '@journey');
    if (tiers.length !== 1) errors.push(`${label}: choose exactly one of @focused or @journey`);
    if (!FEATURES.some(f => c.tags.includes(`@${f}`))) errors.push(`${label}: missing feature tag`);
    for (const tag of c.tags) if (!['@focused', '@journey', '@phone', ...FEATURES.map(f => `@${f}`)].includes(tag)) errors.push(`${label}: unknown tag ${tag}`);
    if (c.project !== (c.tags.includes('@phone') ? 'phone' : 'desktop')) errors.push(`${label}: wrong device project`);
    if (c.expectedStatus === 'skipped') errors.push(`${label}: explicitly skipped coverage`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return cases;
}

export function selectBrowserCases(cases, features) {
  validateFeatures(features);
  const selected = cases.filter(c => c.tags.includes('@focused') && features.some(f => c.tags.includes(`@${f}`)));
  if (!selected.length) throw new Error(`No focused browser checks for ${features.join(', ')}`);
  return selected;
}
