import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkArt } from '../scripts/art-check';

// The same check as `npm run art:check`: every art file matches what the code expects (sizes,
// frame layouts, animation tags, portrait strips). Warnings (a WebP older than its PNG) are left
// to the command, since a git checkout does not keep file times.
test('every art file matches what the game expects', () => {
  const errors = checkArt().filter(p => !p.warning);
  assert.deepEqual(errors, [], errors.map(e => `${e.file}: ${e.message}`).join('\n'));
});
