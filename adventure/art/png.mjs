// Palette-indexed PNG encoding for runtime art (upng-js, MIT). The art scripts already reduce
// every image to at most 128 colours, so indexing is exact and files shrink to roughly a third.
import UPNG from 'upng-js';

/** Encodes a pngjs-style image ({ width, height, data: RGBA Buffer }) as an indexed PNG. */
export function encodeIndexed(img) {
  const rgba = img.data.buffer.slice(img.data.byteOffset, img.data.byteOffset + img.data.length);
  return Buffer.from(UPNG.encode([rgba], img.width, img.height, 256));
}
