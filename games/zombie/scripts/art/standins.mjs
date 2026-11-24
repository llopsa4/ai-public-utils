// `npm run art:standins`: writes a grey numbered stand-in for every contract frame that has no file in
// art/frames/<key>/ yet (at the sheet's scale, 1x or 2x), records them in art/frames/standins.json, and
// rebuilds the atlases. Real art is never overwritten; `art:pack` replaces a stand-in and removes it from the list.
import { buildAtlases, loadManifest, parseArgs, readStandins, writeStandinFrames, writeStandins } from './lib.mjs';

const { root } = parseArgs(process.argv.slice(2));
const manifest = loadManifest(root);
const standins = readStandins(root);
const made = writeStandinFrames(root, manifest, standins);
writeStandins(root, standins);
const groups = buildAtlases(root, manifest);
console.log(`Wrote ${made} new stand-in frames; atlases: ${groups.join(', ')}.`);
