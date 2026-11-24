import { chromium } from '@playwright/test';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { join } from 'node:path';

const batch = 'art/inbox/A4-limp-r1';
const preview = readFileSync(join(batch, 'local-preview-root.txt'), 'utf8');
const url = 'http://127.0.0.1:5214';
const browser = await chromium.launch();
const results = [];
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url + '/a4-review.html');
  await page.waitForFunction(() => document.images[0]?.naturalWidth === 640);
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
    const rows = await page.evaluate(async name => {
      const scene = window.dwGame.scene.getScene(name);
      const { UnitSprite } = await import('/render/units.ts');
      const { zombieVariant } = await import('/render/figure.ts');
      scene.scene.pause();
      for (const sprite of (scene.units ?? scene.sprites).values()) sprite.body.setVisible(false);
      const roster = scene.state.survivors;
      const zombie = scene.state.enemies.find(enemy => enemy.kind === 'zombie') ??
        { side: 'enemy', kind: 'zombie', stance: 'walk', mode: 'wander', hp: 100 };
      const bodies = ['a', 'b', 'c'].map(letter => {
        const key = 'zombie_fresh_' + letter;
        const id = Array.from({ length: 100 }, (_, i) => 'review' + i)
          .find(candidate => zombieVariant(candidate) === key);
        if (!id) throw Error('No preview id for ' + key);
        return { ...zombie, id, key };
      });
      const camera = scene.cameras.main;
      const center = camera.midPoint;
      camera.setZoom(2);
      camera.centerOn(center.x, center.y);
      const checks = [];
      const directions = [
        ['se', 'se', [1, 0], false], ['ne', 'ne', [0, -1], false],
        ['sw', 'se', [0, 1], true], ['nw', 'ne', [-1, 0], true],
      ];
      for (const [row, [facing, drawn, vector, flip]] of directions.entries()) {
        for (const [col, original] of [...roster, ...bodies].entries()) {
          const unit = { ...original, hp: 100, path: [], act: null, order: null, stance: 'walk', facing: vector };
          const sprite = new UnitSprite(scene, unit);
          sprite.update(unit, 0, 0);
          const image = sprite.body;
          const key = original.key ?? original.kind;
          const frame = `${key}_idle_${drawn}_0`;
          if (image.frame.name !== frame || image.flipX !== flip || image.width !== 128 ||
            image.scaleX !== .5 || image.originX !== .5 || image.originY !== .875) {
            throw Error(`Unexpected render for ${frame}: ${image.frame.name}`);
          }
          const x = center.x + (col - 2) * 76;
          const y = center.y + (row - 1.5) * 59 + 22;
          image.setPosition(x, y).setDepth(10000);
          if (col === 0) scene.add.text(x - 41, y - 30, facing.toUpperCase(), {
            color: '#d9d9cb', backgroundColor: '#24272a', fontSize: '9px',
          }).setDepth(10001);
          checks.push({ body: key, facing, frame, flip });
        }
      }
      return checks;
    }, sceneName);
    const screenshot = `game-${sceneName.toLowerCase()}.png`;
    await page.screenshot({ path: join(batch, screenshot) });
    copyFileSync(join(batch, screenshot), join(preview, 'src', screenshot));
    results.push({ scene: sceneName, checks: rows });
  }
} finally {
  await browser.close();
  writeFileSync(join(batch, 'browser-checks.json'), JSON.stringify({ url, errors, results,
    note: 'Synthetic idle comparison using the real scene and UnitSprite. Other fresh animation frames in the preview are stand-ins.' }, null, 2));
}
assert.equal(errors.length, 0, errors.join('\n'));
console.log(results.map(result => `${result.scene}: ${result.checks.length} idle renders`).join('\n'));
const reviewFile = join(preview, 'src/a4-review.html');
const page = readFileSync(reviewFile, 'utf8');
writeFileSync(reviewFile, page.replace('</html>', `<h2>In-game comparisons</h2>
<p>Cass, Eli, work jacket, cardigan, hoodie, from left to right. The other zombie animations still use stand-ins in this preview.</p>
<ul>${results.map(({ scene }) => `<li><a href="./game-${scene.toLowerCase()}.png">${scene}</a></li>`).join('')}</ul></html>`));
