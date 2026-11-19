import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

test('opening Map after its initial hidden retry has expired refits its labels', () => {
  const listeners = new Map<string, () => void>();
  let fits = 0;
  const svg = {};
  const nodes = new Map<string, unknown>();
  for (const name of ['notes', 'diary', 'map']) {
    nodes.set(`tab-${name}`, {
      setAttribute() {}, focus() {},
      addEventListener(event: string, listener: () => void) { listeners.set(`${name}:${event}`, listener); },
    });
    nodes.set(`${name}-panel`, { hidden: name !== 'notes', querySelector: () => svg });
  }
  nodes.set('notebook', { classList: { toggle() {} }, querySelector: () => svg });
  nodes.set('map', { querySelector: () => svg });
  const source = readFileSync(new URL('../src/ui/journal.ts', import.meta.url), 'utf8')
    .replace(/import\.meta\.glob\([^;]+;/, '{};');
  const compiled = stripTypeScriptTypes(source).replace(/^import .*;$/gm, '').replace(/export /g, '')
    + '\nexports.initNotebookTabs = initNotebookTabs;';
  const exports: Record<string, () => void> = {};
  runInNewContext(compiled, {
    exports,
    document: { getElementById: (id: string) => nodes.get(id), fonts: { ready: Promise.resolve(), addEventListener() {} } },
    requestAnimationFrame: (callback: () => void) => { callback(); return 1; },
    window: { addEventListener() {} },
    fitPlatesWhenShown: () => { fits++; },
    fitNotebookPlates: () => { fits++; },
  });
  exports.initNotebookTabs();
  // There is no pending animation-frame retry left; only selecting the tab can repair it.
  listeners.get('map:click')!();
  assert.ok(fits > 0, 'Map activation must measure its now-visible labels');
});
