// Palette-indexed PNG encoding for runtime art (upng-js, MIT). The art scripts already reduce
// every image to the master palette (160 colours) or fewer, so it is encoded losslessly: UPNG then
// indexes it exactly by itself. (Asking UPNG for 256 colours ran its own quantizer, which could merge
// two palette colours and push a picture off the master palette: Codex's pilot hit this.)
import UPNG from 'upng-js';
import { inflateSync, deflateSync, constants } from 'node:zlib';

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Recompress the indexed scanlines, preserving every palette entry and pixel. */
function compressIndexed(png) {
  const chunks = [];
  for (let offset = 8; offset < png.length;) {
    const length = png.readUInt32BE(offset), type = png.toString('ascii', offset + 4, offset + 8);
    chunks.push({ type, raw: png.subarray(offset, offset + length + 12), data: png.subarray(offset + 8, offset + length + 8) });
    offset += length + 12;
  }
  const compressed = Buffer.concat(chunks.filter(c => c.type === 'IDAT').map(c => c.data));
  const scanlines = inflateSync(compressed);
  let best = compressed;
  for (const strategy of [constants.Z_DEFAULT_STRATEGY, constants.Z_FILTERED]) {
    const candidate = deflateSync(scanlines, { level: 9, memLevel: 9, strategy });
    if (candidate.length < best.length) best = candidate;
  }
  if (best === compressed) return png;
  const body = Buffer.concat([Buffer.from('IDAT'), best]), chunk = Buffer.alloc(body.length + 8);
  chunk.writeUInt32BE(best.length); body.copy(chunk, 4); chunk.writeUInt32BE(crc32(body), chunk.length - 4);
  let written = false;
  return Buffer.concat([png.subarray(0, 8), ...chunks.flatMap(c => {
    if (c.type !== 'IDAT') return [c.raw];
    if (written) return [];
    written = true; return [chunk];
  })]);
}

/** Encodes a pngjs-style image ({ width, height, data: RGBA Buffer }) as an indexed PNG. */
export function encodeIndexed(img) {
  const rgba = img.data.buffer.slice(img.data.byteOffset, img.data.byteOffset + img.data.length);
  return compressIndexed(Buffer.from(UPNG.encode([rgba], img.width, img.height, 0)));
}
