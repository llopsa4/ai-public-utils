// Copies Kiln Courier's stylesheet (../FFCardGame/style.css) into src/kc/kc.css, scoped under .kc.
//
// Every selector is prefixed with `.kc` (`:root`, `html` and `body` become `.kc` itself), animation
// names get a `kc-` prefix, the bundled fonts are replaced by the @fontsource packages of the same
// families (Cinzel, Cormorant Garamond), and image URLs point at the small WebPs from art/kc.mjs.
// Runs as part of `npm run build` (and `npm run dev`), so FFCardGame's style changes come along.
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../../FFCardGame/style.css', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const out = new URL('../src/kc/kc.css', import.meta.url);

let css = src.replace(/\/\*[\s\S]*?\*\//g, '');
css = css.replaceAll('KilnSerif', "'Cinzel'").replaceAll('KilnText', "'Cormorant Garamond'");
css = css.replaceAll("url('./assets/kiln-hall.png')", "url('../../art/src/kc/regulator-gallery.webp')");

const frames = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]));
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function scopeSelector(sel) {
  sel = sel.trim();
  if (!sel) return sel;
  for (const root of [':root', 'html', 'body']) {
    if (sel === root) return '.kc';
    if ([' ', ':', '.', '['].some(c => sel.startsWith(root + c))) return '.kc' + sel.slice(root.length);
  }
  return '.kc ' + sel;
}

function renameAnimations(body) {
  return body.replace(/(animation(?:-name)?\s*:)([^;}]*)/g, (_, prop, value) => {
    for (const name of frames) value = value.replace(new RegExp(`(?<![\\w-])${escape(name)}(?![\\w-])`, 'g'), 'kc-' + name);
    return prop + value;
  });
}

function walk(text) {
  const res = [];
  let i = 0;
  while (i < text.length) {
    const j = text.indexOf('{', i);
    if (j < 0) { res.push(text.slice(i)); break; }
    const head = text.slice(i, j).trim();
    let depth = 1, k = j + 1;
    while (depth && k < text.length) {
      if (text[k] === '{') depth++;
      else if (text[k] === '}') depth--;
      k++;
    }
    const body = text.slice(j + 1, k - 1);
    if (head.startsWith('@font-face')) { /* fonts come from @fontsource (imported by src/kc/mount.tsx) */ }
    else if (head.startsWith('@keyframes')) res.push(`@keyframes kc-${head.split(/\s+/)[1]} {${body}}\n`);
    else if (head.startsWith('@media') || head.startsWith('@supports')) res.push(`${head} {\n${walk(body)}}\n`);
    else if (head.startsWith('@')) res.push(`${head} {${body}}\n`);
    else res.push(`${head.split(',').map(scopeSelector).join(', ')} {${renameAnimations(body)}}\n`);
    i = k;
  }
  return res.join('');
}

const header = "/* Kiln Courier's stylesheet (FFCardGame/style.css), scoped under .kc by scripts/kc-css.mjs.\n"
  + '   Do not edit by hand: change FFCardGame and re-run the script; Cinderfold additions go in kc-local.css. */\n';
const next = header + walk(css);
let current = '';
try { current = readFileSync(out, 'utf8'); } catch { /* first run */ }
if (current !== next) writeFileSync(out, next);
console.log(`${current === next ? 'Up to date' : 'Wrote'}: src/kc/kc.css (${frames.size} animations renamed).`);
