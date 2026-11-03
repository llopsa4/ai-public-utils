import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { act, fightStep, idle, open, startNewGame, state } from './helpers';

/** Runs an interaction and plays it through, winning any fight it starts. */
async function actThroughFight(page: Page, verb: string, target: string, until: () => Promise<boolean>, item?: string): Promise<void> {
  await idle(page);
  await page.evaluate(([verb, target, item]) => {
    const { session, interact } = (window as any).adventure;
    void session.scene.runScript(interact(session.state, verb, target, item ?? undefined));
  }, [verb, target, item ?? null] as const);
  for (let i = 0; i < 400 && !(await until()); i++) {
    if (await page.locator('#kc-root .combat-screen').isVisible().catch(() => false)) await fightStep(page);
    else { await page.evaluate(() => (window as any).adventure.session.ui.skip()); await page.waitForTimeout(200); }
  }
}

test('debug mode: chapter 2 plays from the tunnels to its end card, and Bryn teaches Tempered Flow', async ({ page }) => {
  test.setTimeout(420_000);
  const errors: string[] = [];
  await open(page, errors);
  await startNewGame(page);
  // Jump with the debug panel's chapter menu (the real chapter change).
  await page.keyboard.press('`');
  await page.locator('#debug-panel select').first().selectOption('ch2');
  // Chapter 2's opening over black: its title first.
  await expect(page.locator('#intro-text .intro-title')).toHaveText('Chapter 2: Tempered Flow', { timeout: 30_000 });
  await page.evaluate(() => document.getElementById('intro-skip')!.click());
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.state.chapter), { timeout: 30_000 }).toBe('ch2');
  await idle(page);
  await expect(page.locator('#intro')).toBeHidden({ timeout: 10_000 });
  // Once per save: the chapter is now reached, which is what keeps the intro from playing again.
  expect(await page.evaluate(() => (window as any).adventure.session.state.reached)).toContain('ch2');
  await page.keyboard.press('`');
  // The calm start at the tunnel mouth, then in (the roof falls behind him).
  expect((await state(page)).room).toBe('tunnelMouth');
  await act(page, 'use', 'pipeSeat');
  await act(page, 'go', 'arch');
  expect((await state(page)).room).toBe('tunnelCollapse');
  const full = () => page.evaluate(() => (window as any).adventure.session.state);
  const settled = async (flag: string) => !!(await state(page)).flags[flag]
    && await page.evaluate(() => !(window as any).adventure.session.scene.isBusy());

  // The tunnels: each puzzle wakes a random creature, and each win leaves 4 salvage.
  const salvage = (await full()).bag.salvage;
  // The debug jump brings no scarf, so the rag lies in the rubble.
  await act(page, 'take', 'rag');
  expect((await state(page)).inventory).toContain('rag');
  await act(page, 'use', 'grate');
  expect((await state(page)).flags.grateOpen).toBeFalsy();
  await actThroughFight(page, 'use', 'grate', () => settled('tunnel1Clear'), 'gauntlet');
  await act(page, 'go', 'grate');
  expect((await state(page)).room).toBe('tunnelSteam');
  await act(page, 'go', 'passage');
  expect((await state(page)).room).toBe('tunnelSteam');
  // The wrong valve scalds him.
  const before = (await full()).kit.hp;
  await act(page, 'use', 'ironValve');
  expect((await full()).kit.hp).toBe(before - 5);
  await actThroughFight(page, 'use', 'copperValve', () => settled('tunnel2Clear'));
  await act(page, 'go', 'passage');
  expect((await state(page)).room).toBe('tunnelCistern');
  await act(page, 'use', 'chain', 'gauntlet');
  expect((await state(page)).flags.bridgeDown).toBeFalsy();
  await actThroughFight(page, 'use', 'chain', () => settled('tunnel3Clear'), 'rag');
  expect((await state(page)).inventory).not.toContain('rag');
  await act(page, 'go', 'farLedge');
  const out = await full();
  expect(out.room).toBe('road');
  expect(out.bag.salvage).toBe(salvage + 12);

  await act(page, 'use', 'door');
  expect((await state(page)).room).toBe('workshop');
  await act(page, 'talk', 'bryn');
  expect((await state(page)).flags.offeredPractice).toBe(true);
  // Bryn retunes the gauntlet first: Tempered Flow and its growth.
  await act(page, 'use', 'bench', 'gauntlet');
  const tempered = await full();
  expect(tempered.room).toBe('workshop');
  expect(tempered.kit.techniques).toEqual(['tempered-flow']);
  expect([tempered.kit.maxHp, tempered.kit.maxMp]).toEqual([66, 12]);
  // Then the sparring is Kiln Courier's Tempered Flow practice: its banner, the card to play first,
  // and nothing spent in it is lost.
  const hpBefore = tempered.kit.hp;
  await idle(page);
  await page.evaluate(() => { const { session, interact } = (window as any).adventure; void session.scene.runScript(interact(session.state, 'use', 'cage')); });
  await expect(page.locator('#practice-instruction')).toContainText('Tempered Flow', { timeout: 30_000 });
  await expect(page.locator('#kc-root button.card:not(:disabled)')).toHaveCount(1);
  for (let i = 0; i < 400 && !(await settled('sparred')); i++) {
    if (await page.locator('#kc-root .combat-screen').isVisible().catch(() => false)) await fightStep(page);
    else { await page.evaluate(() => (window as any).adventure.session.ui.skip()); await page.waitForTimeout(200); }
  }
  expect((await full()).kit.hp).toBe(hpBefore);
  await act(page, 'talk', 'bryn', undefined, [
    "Cinderfold's cold. Everyone there is waiting on what I'm carrying.",
    "If I slow down, I'll have to think about doing this on my own.",
    "I'm scared it all comes down to me. I need to know I'm not the only one holding it.",
  ]);
  expect((await state(page)).flags.namedNeed).toBe(true);
  await act(page, 'use', 'readingValve', 'regulator');
  expect((await state(page)).room).toBe('backroom');

  await act(page, 'use', 'hearth2');
  await act(page, 'use', 'pouch', 'notebook');
  await act(page, 'talk', 'bryn', undefined, [
    "I'll make a list of what I need for the road.",
    "Could you put my supplies together? I'd rather sleep.",
    'Goodnight, Bryn.',
  ]);
  await act(page, 'look', 'map');
  const ready = await state(page);
  expect(ready.flags.letterSent && ready.flags.askedForHelp && ready.flags.sawValley).toBe(true);
  // Not before a night's sleep; the night tremor wakes him (rested: health back to full).
  await act(page, 'go', 'farDoor');
  expect((await state(page)).flags.tremor).toBeFalsy();
  await act(page, 'use', 'cot');
  const night = await full();
  expect(night.flags.tremor).toBe(true);
  expect(night.kit.hp).toBe(66);
  await page.evaluate(() => { const { session, interact } = (window as any).adventure; void session.scene.runScript(interact(session.state, 'go', 'farDoor')); });
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#end').isVisible();
  }, { timeout: 30_000, intervals: [200] }).toBe(true);
  await expect(page.locator('#end-title')).toHaveText('Tempered Flow');
  expect(errors, errors.join('\n')).toEqual([]);
});

test('without debug mode, chapter 1 ends with the end card and chapter 2 is never downloaded', async ({ page }) => {
  test.setTimeout(120_000);
  const requests: string[] = [];
  page.on('request', r => requests.push(r.url()));
  // A chapter 1 save at the ashways with the passage clear (an old-format save: it is upgraded on load).
  const save = JSON.parse(readFileSync(new URL('../fixtures/saves/v5.json', import.meta.url), 'utf8'));
  Object.assign(save.state, {
    room: 'ashways', hero: { x: 580, y: 320, face: 'left', pose: 'stand' },
    flags: { hasGauntlet: true, hasNotebook: true, latchFixed: true, alarm: true, metOren: true, patchFailed: true, decided: true, procedureKnown: true, kilnCold: true, fought: true, gearChecked: true, valveVented: true },
    inventory: ['gauntlet', 'notebook', 'regulator'],
  });
  await page.addInitScript(text => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('cinderfold.autosave', text); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(save));
  await page.goto('./');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForTimeout(2500);
  // Click the passage (world 424, 164) and choose Go in the action ring.
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  await canvas.click({ position: { x: (424 / 640) * box.width, y: (164 / 360) * box.height } });
  await page.locator('.verb[data-verb="go"]').click();
  await expect.poll(async () => {
    if (await page.locator('#dialogue').isVisible().catch(() => false)) await page.locator('#dialogue').click().catch(() => {});
    return page.locator('#end').isVisible();
  }, { timeout: 30_000, intervals: [300] }).toBe(true);
  await expect(page.locator('#end')).toContainText('To be continued');
  await expect(page.locator('#end-title')).toHaveText('A delivery he does not want');
  expect(requests.filter(u => /\/build\/ch2-[\w-]+\.js/.test(u) || /\/build\/(road|workshop|backroom|bryn)-/.test(u))).toEqual([]);
});
