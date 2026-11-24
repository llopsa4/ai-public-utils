import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';

const review = 'art/inbox/A4-limp-full-r1';
const names = ['idle', 'shamble', 'reach', 'lurch', 'bite', 'death'];
for (const letter of ['a', 'b', 'c']) {
  const directory = join(review, 'candidate', 'zombie_fresh_' + letter);
  if (!existsSync(join(directory, 'death_ne_3.png'))) continue;
  const image = new PNG({ width: 1152, height: 576 });
  for (let i = 0; i < image.data.length; i += 4) image.data.set([75, 79, 73, 255], i);
  for (const [row, name] of names.entries()) {
    const frames = name === 'idle' ? 1 : name === 'bite' ? 3 : name === 'death' ? 4 : 6;
    for (const [col, facing] of ['se', 'ne'].entries()) for (let i = 0; i < frames; i++) {
      const sample = PNG.sync.read(readFileSync(join(directory, `${name}_${facing}_${i}.png`)));
      for (let y = 0; y < 96; y++) for (let x = 0; x < 96; x++) {
        const pixel = (Math.floor(y * 4 / 3) * 128 + Math.floor(x * 4 / 3)) * 4;
        if (sample.data[pixel + 3]) image.data.set(sample.data.subarray(pixel, pixel + 4),
          (((row * 96 + y) * image.width) + (col * 6 + i) * 96 + x) * 4);
      }
    }
  }
  writeFileSync(join(review, `contact-${letter}.png`), PNG.sync.write(image));
}
