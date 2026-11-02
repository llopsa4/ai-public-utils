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
  for (let guard = 0; guard < 400; guard++) {
    const done = await page.evaluate(() => {
      const { session, game } = (window as any).adventure;
      session.ui.skip();
      return game.scene.isActive('room') && !session.scene.isBusy() && document.getElementById('choices')!.hidden;
    });
    if (done) return;
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
