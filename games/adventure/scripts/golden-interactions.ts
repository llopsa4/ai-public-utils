// Records what interact() answers for every target, verb and item in every room, across the
// story's stages: tests/fixtures/interactions-golden.json. Refactors of the content rules must
// keep producing exactly this (tests/rules-golden.test.ts). Re-run only when behaviour changes
// on purpose:
//
//   npx tsx scripts/golden-interactions.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { goldenAnswers } from '../tests/golden';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures', 'interactions-golden.json');
mkdirSync(dirname(out), { recursive: true });
const answers = goldenAnswers();
writeFileSync(out, JSON.stringify(answers) + '\n');
console.log(`Recorded ${Object.keys(answers).length} answers to ${out}.`);
