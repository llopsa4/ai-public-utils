import { expect, test, type Page } from '@playwright/test';
import { act, finishDialogue, fixtureReady, idle, open, startNewGame, state } from './helpers';

async function preparationFixture(page: Page) {
  await fixtureReady(page);
  await page.evaluate(() => {
    const { session } = (window as any).adventure;
    const s = structuredClone(session.state);
    s.room = 'gallery';
    s.hero = { x: 404, y: 290, face: 'right', pose: 'stand' };
    s.flags = { hasGauntlet: true, hasNotebook: true, latchFixed: true, alarm: true, patchFailed: true, decided: true, procedureKnown: true };
    s.inventory = ['gauntlet', 'notebook'];
    session.replaceState(s);
  });
  await idle(page);
}

test('G/N/M toggle their own screens and respect exploration, modifiers and text entry', { tag: ['@focused', '@input', '@runtime'] }, async ({ page }) => {
  const errors: string[] = [];
  await open(page, errors);
  for (const key of ['g', 'n', 'm']) await page.keyboard.press(key);
  await expect(page.locator('#menu')).not.toBeVisible();
  await expect(page.locator('#notebook')).not.toBeVisible();
  await startNewGame(page);
  await page.keyboard.press('g');
  await expect(page.locator('#gear')).not.toBeVisible();
  await expect(page.locator('#gear-btn')).toBeHidden();

  await page.evaluate(() => {
    const { session } = (window as any).adventure;
    session.state.inventory = ['notebook'];
    session.ui.renderInventory();
  });
  await page.locator('#inventory [data-item="notebook"]').click();
  await page.keyboard.press('n');
  await expect(page.locator('#notebook')).toBeVisible();
  // This is the click-disambiguation timer under test, not a scene-readiness delay.
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => (window as any).adventure.session.selectedItem)).toBeNull();
  await page.keyboard.press('n');

  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('n');
  await expect(page.locator('#notebook')).toBeVisible();
  const stopped = await page.evaluate(() => ({ ...(window as any).adventure.session.scene.hero.position }));
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('m');
  await expect(page.locator('#menu')).not.toBeVisible();
  expect(await page.evaluate(() => ({ ...(window as any).adventure.session.scene.hero.position }))).toEqual(stopped);
  await page.keyboard.press('n');
  await expect(page.locator('#notebook')).not.toBeVisible();
  await page.keyboard.press('N');
  await expect(page.locator('#notebook')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.keyboard.press('m');
  await expect(page.locator('#menu')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', repeat: true, bubbles: true })));
  await expect(page.locator('#menu')).toBeVisible();
  await page.locator('#menu-settings').click();
  await page.keyboard.press('m');
  await expect(page.locator('#settings')).toBeVisible();
  await expect(page.locator('#menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('M');
  await expect(page.locator('#menu')).not.toBeVisible();

  await page.evaluate(() => {
    for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) {
      for (const key of ['g', 'n', 'm']) window.dispatchEvent(new KeyboardEvent('keydown', { key, [modifier]: true, bubbles: true }));
    }
    const editor = document.createElement('input');
    editor.id = 'shortcut-editor';
    document.body.append(editor);
    editor.focus();
  });
  await page.keyboard.type('gnm');
  await expect(page.locator('#shortcut-editor')).toHaveValue('gnm');
  await expect(page.locator('#notebook')).not.toBeVisible();
  await expect(page.locator('#menu')).not.toBeVisible();
  await page.locator('#shortcut-editor').evaluate(el => el.remove());

  await page.evaluate(() => {
    const { session } = (window as any).adventure;
    session.state.flags.gearUnlocked = true;
    session.ui.renderInventory();
    // Multiple presses in the same task exercise the asynchronous first-load guard.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
  });
  await expect(page.locator('#gear .kc-armory')).toHaveCount(1, { timeout: 30_000 });
  await page.keyboard.press('n');
  await expect(page.locator('#notebook')).not.toBeVisible();
  await page.keyboard.press('G');
  await expect(page.locator('#gear')).not.toBeVisible();
  await page.evaluate(() => {
    const { session } = (window as any).adventure;
    void session.scene.runScript([{ type: 'say', actor: 'hero', text: 'line.heroLook' }]);
  });
  await expect(page.locator('#dialogue')).toBeVisible();
  for (const key of ['g', 'n', 'm']) await page.keyboard.press(key);
  for (const id of ['gear', 'notebook', 'menu']) await expect(page.locator(`#${id}`)).not.toBeVisible();
  await finishDialogue(page);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('Oren prepares Mara after the notebook and G completes the guided visit before shutdown', { tag: ['@focused', '@story', '@input', '@saves', '@runtime'] }, async ({ page }, info) => {
  const errors: string[] = [];
  await open(page, errors);
  await startNewGame(page);
  await preparationFixture(page);
  await act(page, 'use', 'regulator', 'gauntlet');
  expect((await state(page)).flags.kilnCold).toBeFalsy();
  await page.evaluate(() => {
    const { session, interact } = (window as any).adventure;
    void session.scene.runScript(interact(session.state, 'talk', 'oren'));
  });
  await expect(page.locator('#dialogue-line')).toContainText(/protection/i);
  await expect.poll(async () => {
    await page.evaluate(() => (window as any).adventure.session.ui.skip());
    return page.locator('#force-veil').count();
  }, { timeout: 30_000, intervals: [100] }).toBe(1);
  expect(await page.evaluate(() => (window as any).adventure.session.state.kit.equipment.armor.id)).toBe('layered-armor');
  expect((await state(page)).flags.gearUnlocked).toBe(true);
  expect((await state(page)).flags.protectionPrepared).toBeFalsy();
  for (const key of ['n', 'm', 'Escape']) await page.keyboard.press(key);
  await expect(page.locator('#force-veil')).toBeVisible();
  await expect(page.locator('#notebook')).not.toBeVisible();
  await expect(page.locator('#menu')).not.toBeVisible();
  await page.keyboard.press('g');
  await expect(page.locator('#gear .kc-armory')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#gear .equipment-art img').first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.scene.hero.sprite.texture.key)).toBe('mara-medium-gauntlet');
  await page.screenshot({ path: info.outputPath('oren-protection-before-shutdown.png') });
  await page.keyboard.press('g');
  await finishDialogue(page);
  expect((await state(page)).flags.protectionPrepared).toBe(true);
  expect((await state(page)).flags.gearChecked).toBeFalsy();
  await page.evaluate(() => (window as any).adventure.session.saveNow());
  await page.reload();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await idle(page);
  expect((await state(page)).flags.protectionPrepared).toBe(true);
  await act(page, 'talk', 'oren');
  await expect(page.locator('#force-veil')).toHaveCount(0);
  await page.keyboard.press('g');
  await expect(page.locator('#gear')).toBeVisible();
  await page.keyboard.press('g');
  expect(errors, errors.join('\n')).toEqual([]);
});
