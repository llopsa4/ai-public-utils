// Generators make placeholders; once an image is imported from Codex (status 'final' in the
// manifest) no generator may overwrite it. Each generator asks here before writing.
import { MANIFEST } from './manifest.mjs';

const finals = new Set(MANIFEST.filter(e => e.status === 'final').flatMap(e => [e.file, e.sheet, e.webp ? e.file.replace(/\.png$/, '.webp') : null].filter(Boolean)));

/** True if `file` (a path under art/src) is final Codex art. */
export function isFinal(file) {
  return finals.has(file.replaceAll('\\', '/'));
}

/** Runs `write` unless the file is final art; returns whether it wrote. */
export function unlessFinal(file, write) {
  if (isFinal(file)) { console.log(`  ${file}: final art, kept.`); return false; }
  write();
  return true;
}
