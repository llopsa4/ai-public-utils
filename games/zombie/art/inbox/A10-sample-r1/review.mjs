import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5276';
const output = new URL('./', import.meta.url);
const browser = await chromium.launch();
const checks = [];
const errors = [];

try {
  for (const [textSize, width] of [[100, 128], [150, 192]]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript((size) => {
      localStorage.setItem('deadwoods.options', JSON.stringify({ textSize: size }));
    }, textSize);
    await page.goto(`${url}/?debug&a10`);
    await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.dwGame.scene.isActive('Dialogue'));

    for (const [speaker, name] of [['Scout', 'scout'], ['Fighter', 'fighter']]) {
      const frame = `portrait_${name}_neutral`;
      await page.waitForFunction((key) => {
        const scene = window.dwGame.scene.getScene('Dialogue');
        return scene.head?.visible && scene.head.frame.name === key
          && scene.body.text === scene.state.lines[scene.state.index].text;
      }, frame);
      const details = await page.evaluate(() => {
        const scene = window.dwGame.scene.getScene('Dialogue');
        const head = scene.head;
        return {
          speaker: scene.name.text,
          text: scene.body.text,
          atlas: head.texture.key,
          source: [head.frame.width, head.frame.height],
          display: [head.displayWidth, head.displayHeight],
        };
      });
      assert.equal(details.speaker, speaker);
      assert.ok(details.text.length > 30);
      assert.equal(details.atlas, 'ui');
      assert.deepEqual(details.source, [256, 256]);
      assert.deepEqual(details.display, [width, width]);
      const file = `base-${name}-${textSize}.png`;
      await writeFile(new URL(file, output), await page.screenshot());
      checks.push({ file, frame, textSize, ...details });
      if (name === 'scout') await page.keyboard.press('Enter');
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL('browser-checks.json', output), JSON.stringify({ url, checks, errors }, null, 2) + '\n');
  console.log(`Verified ${checks.length} in-game dialogue portraits.`);
} finally {
  await browser.close();
}
