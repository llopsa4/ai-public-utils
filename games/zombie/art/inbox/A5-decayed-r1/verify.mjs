import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { join } from 'node:path';

const review = 'art/inbox/A5-decayed-r1';
const installed = process.argv.includes('--installed');
const prefix = installed ? 'installed-' : '';
const url = installed ? 'http://127.0.0.1:5216' : 'http://127.0.0.1:5217';
const { figures } = JSON.parse(readFileSync('art/manifest.json', 'utf8'));
const { anims } = JSON.parse(readFileSync('src/data/anims.json', 'utf8'));
const ids = ['a', 'b', 'c'].map(letter => 'zombie_decayed_' + letter);
const browser = await chromium.launch();
const errors = [];
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  if (!installed) {
    await page.goto(url + '/a5-decayed-review.html');
    const allCanvasesDrawn = () => [...document.querySelectorAll('canvas')].every(canvas =>
      canvas.getContext('2d').getImageData(0, 0, 128, 128).data.some((channel, i) => i % 4 === 3 && channel > 0));
    for (const anim of Object.keys(figures.keys[ids[0]].anims)) {
      await page.selectOption('#anim', anim);
      await page.waitForFunction(allCanvasesDrawn);
    }
    await page.selectOption('#anim', 'idle');
    await page.waitForFunction(allCanvasesDrawn);
    await page.waitForTimeout(100);
    const decayed = await page.locator('canvas').first().evaluate(canvas => canvas.toDataURL());
    await page.check('#fresh');
    await page.waitForFunction(previous => {
      const canvas = document.querySelector('canvas');
      const hasPixels = canvas.getContext('2d').getImageData(0, 0, 128, 128).data
        .some((channel, i) => i % 4 === 3 && channel > 0);
      return hasPixels && canvas.toDataURL() !== previous;
    }, decayed);
    await page.uncheck('#fresh');
    await page.selectOption('#anim', 'reach');
    await page.waitForFunction(allCanvasesDrawn);
    await page.screenshot({ path: join(review, prefix + 'animation-review.png'), fullPage: true });
  }
  await page.goto(url + '/?debug');
  await page.waitForFunction(() => window.dwGame?.scene.isActive('Menu'));
  for (const sceneName of ['Intro', 'Mission', 'Base']) {
    await page.evaluate(name => {
      const game = window.dwGame;
      for (const scene of game.scene.getScenes(true)) game.scene.stop(scene.scene.key);
      game.registry.remove('campaign');
      game.scene.start(name);
    }, sceneName);
    await page.waitForFunction(name => !!window.dwGame.scene.getScene(name)?.state, sceneName);
    for (let i = 0; i < 30 && await page.evaluate(() => window.dwGame.scene.isActive('Dialogue')); i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(70);
    }
    const rows = await page.evaluate(async ({ sceneName, anims, counts, ids }) => {
      const scene = window.dwGame.scene.getScene(sceneName);
      const { UnitSprite } = await import('/render/units.ts');
      const { zombieVariant } = await import('/render/figure.ts');
      scene.scene.pause();
      const checked = [];
      const facings = [
        ['se', 'se', [1, 0], false], ['ne', 'ne', [0, -1], false],
        ['sw', 'se', [0, 1], true], ['nw', 'ne', [-1, 0], true],
      ];
      const camera = scene.cameras.main;
      const center = camera.midPoint;
      camera.setZoom(1.65);
      camera.centerOn(center.x, center.y);
      for (const [col, key] of ids.entries()) {
        const id = Array.from({ length: 100 }, (_, i) => 'a5-decayed-' + i)
          .find(candidate => zombieVariant(candidate) === key);
        if (!id) throw Error('No preview id for ' + key);
        const base = { side: 'enemy', kind: 'zombie', id, hp: 100, act: null };
        for (const [facing, drawn, vector, flip] of facings) for (const [anim, n] of Object.entries(counts)) {
          const unit = {
            ...base, facing: vector,
            path: ['shamble', 'reach', 'lurch'].includes(anim) ? [[0, 0]] : [],
            ai: { mode: anim === 'lurch' ? 'chase' : 'wander', near: anim === 'reach' },
            act: anim === 'bite' ? { kind: 'bite', tick: 100 } : null,
            hp: anim === 'death' ? 0 : 100,
          };
          const sprite = new UnitSprite(scene, base);
          for (let frame = 0; frame < n; frame++) {
            const fps = anims[anim].fps;
            const offset = (frame + .05) * 10 / fps;
            if (anims[anim].loop) sprite.update(unit, 200 + offset - sprite.phase * 10, 0);
            else sprite.update(unit, 100, offset);
            const image = sprite.body;
            const expected = `${key}_${anim}_${drawn}_${frame}`;
            if (image.frame.name !== expected || image.flipX !== flip || image.width !== 128 ||
              image.scaleX !== .5 || image.originX !== .5 || image.originY !== .875) {
              throw Error(`${sceneName}: expected ${expected}, drew ${image.frame.name}`);
            }
            checked.push({ key, anim, facing, frame });
          }
          sprite.body.destroy();
          sprite.cue.destroy();
        }
        for (const [row, anim] of ['idle', 'shamble', 'reach', 'lurch', 'bite', 'death'].entries()) {
          const sprite = new UnitSprite(scene, base);
          const subject = { ...base, facing: [1, 0], path: row > 0 && row < 4 ? [[0, 0]] : [],
            ai: { mode: anim === 'lurch' ? 'chase' : 'wander', near: anim === 'reach' },
            hp: anim === 'death' ? 0 : 100, act: anim === 'bite' ? { kind: 'bite', tick: 100 } : null };
          sprite.update(subject, 100, 0);
          sprite.update(subject, 100, anim === 'death' ? 3.1 * 10 / anims.death.fps : Math.max(0, 1.1 * 10 / anims[anim].fps - (anims[anim].loop ? sprite.phase * 10 : 0)));
          const x = center.x + (col - 1) * 100;
          const y = center.y + (row - 2.5) * 63 + 20;
          sprite.body.setPosition(x, y).setDepth(10000);
          if (col === 0) scene.add.text(x - 60, y - 32, anim, {
            color: '#d9d9cb', backgroundColor: '#24272a', fontSize: '9px',
          }).setDepth(10001);
        }
      }
      return checked;
    }, { sceneName, anims, counts: figures.keys[ids[0]].anims, ids });
    assert.equal(rows.length, 312);
    await page.screenshot({ path: join(review, prefix + `game-${sceneName.toLowerCase()}.png`) });
    results.push({ scene: sceneName, rendered: rows.length });
  }
} finally {
  await browser.close();
  writeFileSync(join(review, prefix + 'browser-checks.json'), JSON.stringify({ url, errors, results,
    note: 'Frames checked through actual UnitSprite with synthetic simulation states.' }, null, 2));
}
assert.equal(errors.length, 0, errors.join('\n'));
console.log(results);
