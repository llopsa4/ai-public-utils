import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:5278';
const prefix = process.argv.includes('--installed') ? 'installed-' : '';
const output = new URL('./', import.meta.url);
const browser = await chromium.launch();
const checks = [];
const errors = [];
const who = [['Fighter', 'fighter'], ['Scout', 'scout']];

async function save(page, file) {
  await page.screenshot({ path: new URL(prefix + file, output).pathname.replace(/^\/(?=[A-Z]:)/i, '') });
}

async function recordDialogue(page, key, textSize, width) {
  await page.waitForFunction((frame) => {
    const scene = window.dwGame.scene.getScene('Dialogue');
    return scene.head?.visible && scene.head.frame.name === frame
      && scene.body.text === scene.state.lines[0].text;
  }, key);

  const details = await page.evaluate(() => {
    const head = window.dwGame.scene.getScene('Dialogue').head;
    return { texture: head.texture.key, source: head.frame.width, display: head.displayWidth };
  });
  assert.deepEqual(details, { texture: 'ui', source: 256, display: width });
  const filename = `${key}-${textSize}.png`;
  if (textSize === 100) await save(page, filename);
  checks.push({ kind: 'dialogue', key, textSize, ...details });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !window.dwGame.scene.isActive('Dialogue'));
}

async function recordSquad(page, mood, textSize, width) {
  const keys = who.map(([, name]) => `portrait_small_${name}_${mood}`);
  await page.waitForFunction((frames) => {
    const slots = window.dwGame.scene.getScene('Squad').slots;
    return slots.length === 2 && slots.every((slot, i) => slot.head.visible && slot.head.frame.name === frames[i]);
  }, keys);
  const heads = await page.evaluate(() => window.dwGame.scene.getScene('Squad').slots.map(({ head }) => ({
    key: head.frame.name, texture: head.texture.key, source: head.frame.width, display: head.displayWidth,
  })));
  assert.deepEqual(heads, keys.map((key) => ({ key, texture: 'ui', source: 72, display: width })));
  const filename = `squad-${mood}-${textSize}.png`;
  if (textSize === 100) await save(page, filename);
  checks.push(...heads.map((head) => ({ kind: 'squad', textSize, ...head })));
}

try {
  for (const textSize of [100, 150]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript((size) => {
      localStorage.setItem('deadwoods.options', JSON.stringify({ textSize: size }));
      localStorage.setItem('deadwoods.save', JSON.stringify({
        version: 2, stage: 'mission1', food: 0, scrap: 0, ammo: 3, cassGun: false,
      }));
    }, textSize);
    await page.goto(`${url}/?debug`);
    await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => window.dwGame.scene.isActive('Mission') && window.dw?.say);
    const dialogueWidth = textSize === 100 ? 128 : 192;
    const squadWidth = textSize === 100 ? 36 : 54;
    await recordSquad(page, 'neutral', textSize, squadWidth);

    for (const mood of ['neutral', 'afraid', 'determined', 'hurt']) {
      if (mood === 'hurt') {
        await page.evaluate(() => {
          for (const unit of window.dw.state.survivors) unit.hp = 20;
        });
        await recordSquad(page, 'hurt', textSize, squadWidth);
      }
      for (const [speaker, name] of who) {
        await page.evaluate(([speaker, mood]) => window.dw.say([{
          speaker, mood: mood === 'hurt' ? 'neutral' : mood,
          text: 'We can take the trail from here.',
        }]), [speaker, mood]);
        await recordDialogue(page, `portrait_${name}_${mood}`, textSize, dialogueWidth);
      }
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(new URL(prefix + 'browser-checks.json', output), JSON.stringify({ url, checks, errors }, null, 2) + '\n');
  console.log(`Verified ${checks.length} dialogue and squad portrait draws.`);
} finally {
  await browser.close();
}
