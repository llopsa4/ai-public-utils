import { expect, type Page } from '@playwright/test';

/** Loads the game with the debug hook, a clean browser slot and console errors collected. */
export async function open(page: Page, errors: string[], { clear = true } = {}): Promise<void> {
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  if (clear) await page.addInitScript(() => { if (!sessionStorage.getItem('e2e-kept')) { localStorage.clear(); sessionStorage.setItem('e2e-kept', '1'); } });
  await page.goto('?debug');
  await expect(page.locator('#title')).toBeVisible();
}

/** Waits until the room scene is running and idle (no script, walk-in or fade). */
export async function idle(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const a = (window as any).adventure;
    return a && !a.session.onTitle && a.game.scene.isActive('room') && !a.session.scene.isBusy();
  });
}

/**
 * Plays one interaction through the real scene: the action as the action ring would run it.
 * Spoken lines are skipped as they appear; dialogue choices are clicked by their text, in order.
 */
export async function act(page: Page, verb: string, target: string, item?: string, choices: string[] = []): Promise<void> {
  await idle(page);
  await page.evaluate(([verb, target, item]) => {
    const { session, interact } = (window as any).adventure;
    void session.scene.runScript(interact(session.state, verb, target, item ?? undefined));
  }, [verb, target, item ?? null] as const);
  const pending = [...choices];
  for (let guard = 0; guard < 1500; guard++) {
    const done = await page.evaluate(() => {
      const { session, game } = (window as any).adventure;
      session.ui.skip();
      return game.scene.isActive('room') && !session.scene.isBusy() && document.getElementById('choices')!.hidden;
    });
    if (done) return;
    // A fight: follow the guide, else play the first playable card, else end the turn; then Continue.
    // The gear menu and the shop wait for the player: take what is offered and close.
    for (const id of ['gear', 'shop']) {
      const dialog = page.locator(`#${id}[open]`);
      if (await dialog.count()) await dialog.locator('.dialog-close').click();
    }
    if (await page.locator('#battle').isVisible()) {
      await fightStep(page);
      continue;
    }
    const box = page.locator('#choices');
    if (await box.isVisible()) {
      const wanted = pending[0];
      const button = wanted ? box.getByRole('button', { name: wanted, exact: true }) : box.getByRole('button').last();
      if (await button.count()) { await button.click(); if (wanted) pending.shift(); }
      else await box.getByRole('button').last().click();
    }
    await page.waitForTimeout(60);
  }
  throw new Error(`${verb} ${target} did not finish`);
}

export async function state(page: Page): Promise<{ room: string; flags: Record<string, boolean>; inventory: string[] }> {
  return page.evaluate(() => structuredClone((window as any).adventure.session.state));
}

/** Title screen → New game → skips the opening, and waits for the first room. */
export async function startNewGame(page: Page, tap = false): Promise<void> {
  const button = page.getByRole('button', { name: 'New game' });
  if (tap) await button.tap(); else await button.click();
  const skip = page.locator('#intro-skip');
  await expect(skip).toBeVisible();
  if (tap) await skip.tap(); else await skip.click();
  await idle(page);
}

/** One move in a fight, as a player would make it (clicks on the real buttons). */
export async function fightStep(page: Page): Promise<void> {
  const cont = page.locator('#battle-continue');
  if (await cont.isVisible()) { await cont.click(); return; }
  const askedEnd = page.locator('#battle-end.asked:not(:disabled)');
  if (await askedEnd.count()) { await askedEnd.click(); await page.waitForTimeout(250); return; }
  const asked = page.locator('.battle-card.asked:not(:disabled)');
  const card = (await asked.count()) ? asked.first() : page.locator('.battle-card:not(:disabled)').first();
  if (await card.count()) { await card.click(); }
  else {
    const end = page.locator('#battle-end:not(:disabled)');
    if (await end.count()) await end.click();
  }
  await page.waitForTimeout(250);
}
