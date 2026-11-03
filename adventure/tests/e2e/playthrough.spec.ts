import { gzipSync } from 'node:zlib';
import { expect, test } from '@playwright/test';
import { act, idle, open, state, startNewGame } from './helpers';

test('the whole scene plays in the browser, from the title screen into chapter 2 (debug)', async ({ page }) => {
  const errors: string[] = [];
  // What is downloaded before the title screen is usable (raw, and as GitHub Pages sends it: JS/CSS gzipped).
  let raw = 0, wire = 0, counting = true;
  page.on('response', async r => {
    // Phaser re-reads each downloaded image through a blob: URL; only count real downloads.
    if (!counting || !r.ok() || r.url().startsWith('blob:')) return;
    const body = await r.body().catch(() => null);
    if (!body) return;
    raw += body.length;
    wire += /\.(js|css|html)$|\/$/.test(new URL(r.url()).pathname) ? gzipSync(body).length : body.length;
  });
  await open(page, errors);
  await page.waitForTimeout(500);
  counting = false;
  console.log(`First load: ${(raw / 1048576).toFixed(2)} MB raw, ${(wire / 1048576).toFixed(2)} MB as served by GitHub Pages`);
  expect(wire, 'first load as served').toBeLessThan(1.5 * 1048576);

  // A real click on the title screen, then a real click on the floor.
  await page.getByRole('button', { name: 'New game' }).click();
  // The opening: lines of context over black, one per click, then the first room fades in.
  const intro = page.locator('#intro');
  await expect(intro).toBeVisible();
  await expect(page.locator('#intro-text p')).toHaveCount(1, { timeout: 10_000 });
  await expect(page.locator('#intro-text p').first()).toContainText('ash and wind');
  for (let n = 2; n <= 4; n++) {
    await intro.click({ position: { x: 40, y: 40 } });
    await expect(page.locator('#intro-text p')).toHaveCount(n);
  }
  await expect(page.locator('#intro-more')).toHaveClass(/in/, { timeout: 10_000 });
  await intro.click({ position: { x: 40, y: 40 } });
  await expect(intro).toBeHidden({ timeout: 10_000 });
  await idle(page);
  expect((await state(page)).room).toBe('tent');
  const before = await page.evaluate(() => ({ ...(window as any).adventure.session.state.hero }));
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: box.width * 0.4, y: box.height * 0.88 } });
  await page.waitForTimeout(1500);
  await idle(page);
  const after = await page.evaluate(() => ({ ...(window as any).adventure.session.state.hero }));
  expect(after.x !== before.x || after.y !== before.y, 'Mara walks where the floor is clicked').toBeTruthy();

  await act(page, 'go', 'tentFlap');
  expect((await state(page)).room, 'not without the gauntlet').toBe('tent');
  await act(page, 'take', 'rack');
  await act(page, 'take', 'notebook');
  // The lit-gauntlet sheet loads in the background and replaces the unlit one.
  await page.waitForFunction(() => (window as any).adventure.game.textures.exists('mara-gauntlet'));
  await act(page, 'go', 'tentFlap');
  expect((await state(page)).room).toBe('maraRoom');
  await act(page, 'look', 'tally');
  await act(page, 'go', 'roomCurtain');
  expect((await state(page)).room).toBe('firingHouse');
  await act(page, 'use', 'pantryDoor', 'gauntlet');
  await act(page, 'go', 'stairs');
  expect((await state(page)).room).toBe('gallery');
  await act(page, 'use', 'regulator', 'gauntlet');
  await act(page, 'talk', 'oren', undefined, ['There has to be another repair.', 'My mother built half of this.', 'All right. I\'ll do it.']);
  expect((await state(page)).flags.decided).toBe(true);
  await act(page, 'use', 'regulator', 'notebook');
  await act(page, 'use', 'regulator', 'gauntlet');
  expect((await state(page)).flags.kilnCold).toBe(true);
  await act(page, 'go', 'galleryStairs');
  await act(page, 'talk', 'nell');
  expect((await state(page)).inventory).toEqual(expect.arrayContaining(['bread', 'scarf', 'regulator']));
  await act(page, 'go', 'kilnGate');
  expect((await state(page)).room).toBe('ashways');
  await act(page, 'use', 'valve', 'gauntlet');
  await page.evaluate(() => {
    const { session, interact } = (window as any).adventure;
    void session.scene.runScript(interact(session.state, 'go', 'passage'));
  });
  // With ?debug (as these tests run) chapter 1's end leads into chapter 2, with Mara's things carried
  // over; without it the end card shows (tests/e2e/debug-chapter2.spec.ts checks both).
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.evaluate(() => (window as any).adventure.session.state.chapter);
  }, { timeout: 30_000, intervals: [200] }).toBe('ch2');
  await idle(page);
  const next = await state(page);
  expect(next.room).toBe('tunnelMouth');
  expect(next.inventory).toEqual(expect.arrayContaining(['gauntlet', 'notebook', 'regulator', 'bread', 'scarf']));

  // The secret found on the way stays in chapter 1's flags.
  expect(await page.evaluate(() => (window as any).adventure.session.state.earlier.ch1.secretTally)).toBe(true);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('keyboard play: Tab focuses things in the room and Enter opens the action ring', async ({ page }) => {
  const errors: string[] = [];
  await open(page, errors);
  await startNewGame(page);
  await idle(page);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Tab');
  await expect(page.locator('#hover')).toBeVisible();
  const first = await page.locator('#hover').textContent();
  await page.keyboard.press('Tab');
  expect(await page.locator('#hover').textContent()).not.toBe(first);
  await page.keyboard.press('Enter');
  await expect(page.locator('#radial button.verb').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#radial')).toBeHidden();
  expect(errors, errors.join('\n')).toEqual([]);
});

for (const quality of ['high', 'low'] as const) {
  test(`${quality} visual quality: every room renders and the kiln goes cold without errors`, async ({ page }) => {
    const errors: string[] = [];
    await page.addInitScript(q => localStorage.setItem('cinderfold.settings', JSON.stringify({ visualQuality: q })), quality);
    await open(page, errors, { clear: false });
    await startNewGame(page);
    await idle(page);
    for (const room of ['tent', 'maraRoom', 'firingHouse', 'gallery', 'ashways']) {
      await page.evaluate(r => {
        const s = (window as any).adventure.session;
        const st = structuredClone(s.state);
        st.room = r;
        st.hero = { x: 400, y: 300, face: 'left', pose: 'stand' };
        st.flags = { hasGauntlet: true, latchFixed: true, alarm: true, patchFailed: true, decided: true, procedureKnown: true };
        st.inventory = ['gauntlet'];
        s.replaceState(st);
      }, room);
      await idle(page);
      await page.evaluate(() => (window as any).adventure.session.scene.runScript([{ type: 'setFlag', flag: 'kilnCold', value: true }]));
      await page.waitForTimeout(400);
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
