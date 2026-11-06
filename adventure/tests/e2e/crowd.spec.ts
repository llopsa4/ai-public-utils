import { expect, test, type Page } from '@playwright/test';
import { finishDialogue, fixtureReady, idle, open, startNewGame } from './helpers';

type Snap = { id: string; x: number; y: number; task: string | null; away: boolean; gone: boolean; walking: boolean };

const snapshot = (page: Page): Promise<Snap[]> =>
  page.evaluate(() => (window as any).adventure.session.scene.crowd?.snapshot() ?? []);

/** Starts a game in the kiln hall with the gauntlet fitted, as if just out of the tent. */
async function enterHall(page: Page, errors: string[], quality: 'high' | 'low' = 'high'): Promise<void> {
  await page.addInitScript(q => localStorage.setItem('cinderfold.settings', JSON.stringify({ visualQuality: q })), quality);
  await open(page, errors, { clear: false });
  await startNewGame(page);
  await fixtureReady(page);
  await page.evaluate(() => {
    const s = (window as any).adventure.session;
    const st = structuredClone(s.state);
    st.room = 'maraRoom';
    st.hero = { x: 250, y: 330, face: 'down', pose: 'stand' };
    st.flags = { hasGauntlet: true, hasNotebook: true };
    st.inventory = ['gauntlet', 'notebook'];
    s.replaceState(st);
  });
  await idle(page);
  // The six sheets arrive in the background; everyone fades in once theirs is ready.
  await expect.poll(async () => (await snapshot(page)).length, { timeout: 15_000 }).toBe(4);
}

test('the crowd renderer draws a worker at her station, accepts Talk and receives a mood change', { tag: ['@focused', '@crowd', '@art', '@runtime'] }, async ({ page }) => {
  const errors: string[] = [];
  await enterHall(page, errors, 'low');
  await expect.poll(() => page.evaluate(() => {
    const m = (window as any).adventure.session.scene.crowd.visible().find((m: any) => m.def.id === 'extra-hauler');
    return m.actor.sprite.alpha;
  })).toBeGreaterThan(0.9);
  const drawn = await page.evaluate(() => {
    const crowd = (window as any).adventure.session.scene.crowd;
    const m = crowd.visible().find((m: any) => m.def.id === 'extra-hauler');
    const result = {
      target: m.target, task: m.task, actorTask: m.actor.currentTask,
      animation: m.actor.sprite.anims.currentAnim?.key,
      texture: m.actor.sprite.texture.key, x: m.actor.sprite.x, y: m.actor.sprite.y,
    };
    for (const member of crowd.visible()) crowd.hold(member);
    return result;
  });
  expect(drawn).toEqual({
    target: 'brokenPottery', task: 'work', actorTask: 'work',
    animation: 'extra-hauler:work', texture: 'extra-hauler', x: 580, y: 330,
  });
  const at = await page.evaluate(() => {
    const m = (window as any).adventure.session.scene.crowd.visible().find((m: any) => m.def.id === 'extra-hauler');
    const box = m.actor.hitBox();
    return { x: box.centerX, y: box.centerY };
  });
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: at.x / 640 * box.width, y: at.y / 360 * box.height } });
  await page.locator('.verb[data-verb="talk"]').click();
  await expect(page.locator('#dialogue-name')).toHaveText('Dace');
  await finishDialogue(page);
  await page.evaluate(() => (window as any).adventure.session.scene.runScript([{ type: 'setFlag', flag: 'kilnCold', value: true }]));
  const reaction = await page.evaluate(() => {
    const crowd = (window as any).adventure.session.scene.crowd;
    return { mood: crowd.mood, pending: crowd.visible().some((m: any) => m.react === 'cold') };
  });
  expect(reaction).toEqual({ mood: 'cold', pending: true });
  // The full departure animation and complete work cycle remain in @journey tests.
  expect(errors, errors.join('\n')).toEqual([]);
});

test('the kiln hall crowd works, moves about, talks to Mara and reacts when the kiln goes cold', { tag: ["@journey","@crowd","@runtime"] }, async ({ page }, info) => {
  const errors: string[] = [];
  await enterHall(page, errors);
  const first = await snapshot(page);
  await page.waitForTimeout(9000);
  const later = await snapshot(page);
  const moved = later.filter(m => { const f = first.find(o => o.id === m.id)!; return Math.hypot(f.x - m.x, f.y - m.y) > 8 || m.away; });
  expect(moved.length, 'some workers still move about').toBeGreaterThanOrEqual(1);
  const dace = later.find(m => m.id === 'extra-hauler')!;
  expect(dace.task, 'Dace kneels to sort pottery').toBe('work');
  expect(dace.walking).toBe(false);
  expect(dace.x).toBeGreaterThanOrEqual(555);
  expect(dace.y).toBeGreaterThanOrEqual(310);
  // Someone reaches a station and works (the flat hall's stations are far apart: allow the walk).
  await expect.poll(async () => (await snapshot(page)).some(m => m.task !== null), { timeout: 20_000, message: 'someone is at work' }).toBeTruthy();
  // Chatter: a bubble over someone's head, not a line in the panel, and gone after a moment.
  await page.evaluate(() => (window as any).adventure.session.scene.crowd.chat());
  await expect(page.locator('#chatter')).toBeVisible();
  await expect(page.locator('#dialogue')).toBeHidden();
  await page.screenshot({ path: info.outputPath('hall-warm.png') });
  await expect(page.locator('#chatter')).toBeHidden({ timeout: 30_000 });

  // Click the nearest person who is on screen, then Talk.
  const target = await page.evaluate(() => {
    const crowd = (window as any).adventure.session.scene.crowd;
    const m = crowd.visible().find((v: any) => !v.held && v.actor.sprite.alpha > 0.9);
    crowd.hold(m); // keep still while the pointer gets there
    const box = m.actor.hitBox();
    return { id: m.def.id, x: box.centerX, y: box.centerY };
  });
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  const npcsBefore = await page.evaluate(() => structuredClone((window as any).adventure.session.state.npcs));
  await canvas.click({ position: { x: (target.x / 640) * box.width, y: (target.y / 360) * box.height } });
  const talk = page.locator('.verb[data-verb="talk"]');
  await expect(talk).toBeVisible();
  await talk.click();
  await expect(page.locator('#dialogue-name')).toBeVisible({ timeout: 10_000 });
  const names = ['Hollis', 'Wren', 'Dace', 'Ansel'];
  await expect.poll(async () => names.includes((await page.locator('#dialogue-name').textContent()) ?? ''), { timeout: 10_000 }).toBeTruthy();
  await page.screenshot({ path: info.outputPath('hall-talk.png') });
  await page.evaluate(() => (window as any).adventure.session.ui.skip());
  await idle(page);
  expect(await page.evaluate(() => (window as any).adventure.session.state.npcs), 'talking to the crowd changes no saved state')
    .toEqual(npcsBefore);

  // The kiln dies in front of them: two of them leave for good.
  await page.evaluate(() => (window as any).adventure.session.scene.runScript([{ type: 'setFlag', flag: 'kilnCold', value: true }]));
  // Headless Chromium without a GPU can run the game at a few frames per second, and game timers slow with it.
  await expect.poll(async () => (await snapshot(page)).filter(m => m.gone).length, { timeout: 120_000 }).toBe(2);
  await page.screenshot({ path: info.outputPath('hall-cold.png') });
  expect(errors, errors.join('\n')).toEqual([]);
});

test('Hollis shovels at the fire, empties ash at the cart and returns; Dace stays by the pottery', { tag: ["@journey","@crowd"] }, async ({ page }, info) => {
  const errors: string[] = [];
  await enterHall(page, errors, 'low');
  const hollis = async () => (await snapshot(page)).find(m => m.id === 'extra-stoker')!;
  await expect.poll(async () => (await hollis()).task, { timeout: 45_000 }).toBe('work');
  await page.screenshot({ path: info.outputPath('workers-at-work.png') });
  await expect.poll(async () => {
    const m = await hollis();
    return m.task === 'reach' && m.x >= 500 && m.x <= 555;
  }, { timeout: 60_000, intervals: [200] }).toBe(true);
  await expect.poll(async () => (await hollis()).task, { timeout: 30_000 }).toBe('work');
  const dace = (await snapshot(page)).find(m => m.id === 'extra-hauler')!;
  expect(dace.task).toBe('work');
  expect(dace.away || dace.gone || dace.walking).toBe(false);
  expect(dace.x).toBeGreaterThanOrEqual(555);
  expect(dace.y).toBeGreaterThanOrEqual(310);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('entering the hall after the kiln died: only the ones who stayed are there', { tag: ["@focused","@crowd"] }, async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => localStorage.setItem('cinderfold.settings', JSON.stringify({ visualQuality: 'low' })));
  await open(page, errors, { clear: false });
  await startNewGame(page);
  await fixtureReady(page);
  await page.evaluate(() => {
    const s = (window as any).adventure.session;
    const st = structuredClone(s.state);
    st.room = 'maraRoom';
    st.hero = { x: 250, y: 330, face: 'down', pose: 'stand' };
    st.flags = { hasGauntlet: true, kilnCold: true };
    s.replaceState(st);
  });
  await idle(page);
  await expect.poll(async () => (await snapshot(page)).length, { timeout: 15_000 }).toBe(2);
  expect((await snapshot(page)).map(m => m.id).sort()).toEqual(['extra-hoist', 'extra-stoker']);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('two kids play in the firing house and run to Nell when the alarm goes up', { tag: ["@journey","@crowd"] }, async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => localStorage.setItem('cinderfold.settings', JSON.stringify({ visualQuality: 'high' })));
  await open(page, errors, { clear: false });
  await startNewGame(page);
  await fixtureReady(page);
  await page.evaluate(() => {
    const s = (window as any).adventure.session;
    const st = structuredClone(s.state);
    st.room = 'firingHouse';
    st.hero = { x: 600, y: 330, face: 'left', pose: 'stand' };
    st.flags = { hasGauntlet: true, hasNotebook: true, latchFixed: true };
    s.replaceState(st);
  });
  await idle(page);
  await expect.poll(async () => (await snapshot(page)).map(m => m.id).sort(), { timeout: 15_000 }).toEqual(['extra-kid', 'extra-runner']);
  await page.evaluate(() => (window as any).adventure.session.scene.runScript([{ type: 'setFlag', flag: 'alarm', value: true }]));
  const nearNell = async () => (await snapshot(page)).filter(m => !m.walking && Math.hypot(m.x - 250, m.y - 300) < 40).length;
  await expect.poll(nearNell, { timeout: 120_000 }).toBe(2);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('coming back to a room shows its whole background (High quality)', { tag: ["@focused","@art","@runtime"] }, async ({ page }) => {
  const errors: string[] = [];
  await page.addInitScript(() => localStorage.setItem('cinderfold.settings', JSON.stringify({ visualQuality: 'high' })));
  await open(page, errors, { clear: false });
  await startNewGame(page);
  await idle(page);
  const frame = () => page.evaluate(() => (window as any).adventure.session.scene.background.frame.name);
  for (const room of ['maraRoom', 'firingHouse', 'tent', 'maraRoom', 'firingHouse', 'tent']) {
    await fixtureReady(page);
    await page.evaluate(r => {
      const s = (window as any).adventure.session;
      const st = structuredClone(s.state);
      st.room = r;
      st.hero = { x: 400, y: 320, face: 'left', pose: 'stand' };
      st.flags = { hasGauntlet: true, hasNotebook: true };
      s.replaceState(st);
    }, room);
    await idle(page);
    expect(await frame(), `${room} background`).toBe('__BASE');
  }
  expect(errors, errors.join('\n')).toEqual([]);
});
