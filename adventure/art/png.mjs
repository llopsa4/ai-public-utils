// Palette-indexed PNG encoding for runtime art (upng-js, MIT). The art scripts already reduce
// every image to the master palette (160 colours) or fewer, so it is encoded losslessly: UPNG then
// indexes it exactly by itself. (Asking UPNG for 256 colours ran its own quantizer, which could merge
// two palette colours and push a picture off the master palette: Codex's pilot hit this.)
import UPNG from 'upng-js';

/** Encodes a pngjs-style image ({ width, height, data: RGBA Buffer }) as an indexed PNG. */
export function encodeIndexed(img) {
  const rgba = img.data.buffer.slice(img.data.byteOffset, img.data.byteOffset + img.data.length);
  return Buffer.from(UPNG.encode([rgba], img.width, img.height, 0));
}
