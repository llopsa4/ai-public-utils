import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('interface assets contain valid text without UTF-8 decoding artifacts', async () => {
  for (const asset of ['app.mjs', 'index.html', 'styles.css', 'theme.css', 'README.md', 'AGENTS.md']) {
    const text = await readFile(new URL('../' + asset, import.meta.url), 'utf8');
    assert.equal(/\uFFFD|[\u00C2\u00C3][\u0080-\u00BF]|\u00E2\u20AC|\u00EF\u00BF\u00BD/.test(text), false, asset + ' contains encoding damage');
  }
});
