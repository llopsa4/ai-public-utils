import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// Audit A5: index.html must version each asset with its first 12 SHA-256 hex characters,
// so browsers never mix new markup with a cached old script or stylesheet.
test('index.html asset versions match the current file hashes', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const versioned = [...html.matchAll(/(?:href|src)="\.\/([\w.-]+\.(?:mjs|css))\?v=([0-9a-f]+)"/g)];
  assert.deepEqual(versioned.map(m => m[1]).sort(), ['app.mjs', 'styles.css', 'theme.css']);
  for (const [, file, version] of versioned) {
    const hash = createHash('sha256').update(await readFile(new URL('../' + file, import.meta.url))).digest('hex').slice(0, 12);
    assert.equal(version, hash, `${file} needs ?v=${hash} in index.html`);
  }
});
