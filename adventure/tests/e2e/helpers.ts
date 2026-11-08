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
    // The room that is running must be the one the state is in (a room change restarts the scene).
    return a && !a.session.onTitle && a.game.scene.isActive('room') && a.session.scene.room?.id === a.session.state.room && !a.session.scene.isBusy();
  });
}

/**
 * Direct debug state replacement restarts the scene without a doorway walk/fade. Let its
 * queued background assets finish first so the fixture does not interrupt that loader.
 * Ordinary journey interactions deliberately use idle(), not this fixture prerequisite.
 */
export async function fixtureReady(page: Page): Promise<void> {
  await idle(page);
  await page.waitForFunction(() => {
    const { session, game, chapters } = (window as any).adventure;
    return !session.scene.load.isLoading()
      && chapters[session.state.chapter].extras.every((extra: any) => game.textures.exists(extra.sheet));
  });
}

/** Isolate input/renderer checks from unrelated crowd movement after lazy sheets arrive. */
export async function holdCrowd(page: Page, expectedCount: number): Promise<void> {
  await expect.poll(() => page.evaluate(() => (window as any).adventure.session.scene.crowd?.visible().length ?? 0), {
    timeout: 15_000,
    message: 'the fixture crowd has loaded',
  }).toBe(expectedCount);
  await page.evaluate(() => {
    const crowd = (window as any).adventure.session.scene.crowd;
    for (const member of crowd.visible()) crowd.hold(member);
  });
}

/** Finish a conversation with no choices, without assuming how many lines or frames it takes. */
export async function finishDialogue(page: Page): Promise<void> {
  await expect.poll(() => page.evaluate(() => {
    const { session } = (window as any).adventure;
    session.ui.skip();
    return !session.scene.isBusy();
  }), { timeout: 30_000, intervals: [60] }).toBe(true);
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
    if(await page.locator('#regulator-puzzle').isVisible()){
      await solveRegulator(page);continue;
    }
    // A fight: follow the guide, else play the first playable card, else end the turn; then Continue.
    // Oren's forced Gear button, the gear screen and the shop wait for the player.
    if (await page.locator('#force-veil').count()) { await page.locator('#gear-btn').click(); continue; }
    if (await page.locator('#armory-done').isVisible().catch(() => false)) { await page.locator('#armory-done').click(); continue; }
    if (await page.locator('#shop[open]').count()) { await page.locator('#shop .dialog-close').click(); continue; }
    // A fight (Kiln Courier's screen): follow the lesson, or play on.
    if (await page.locator('#kc-root .combat-screen').isVisible().catch(() => false)) {
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

/** Perform the actual controls in journey tests; focused tests exercise partial/invalid sequences. */
export async function solveRegulator(page: Page): Promise<void> {
  for(const action of ['left','right','vent','ring']){
    const part=page.locator(`#regulator-puzzle [data-action="${action}"]`);
    if(await part.getAttribute('aria-pressed')!=='true')await part.click();
  }
  await page.locator('#regulator-release').click();
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

/**
 * One move on Kiln Courier's battle screen, as a player would make it: the lesson's outlined
 * control if there is one; otherwise Continue after a win, else the first playable card, else
 * End turn.
 */
export async function fightStep(page: Page): Promise<void> {
  const root = page.locator('#kc-root');
  // Visible only: FFCardGame's closed dialog keeps an outlined Close button in the page.
  const target = root.locator('.lesson-target:not(:disabled):visible').first();
  if (await target.count()) { await target.click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(250); return; }
  const cont = root.locator('#kc-victory-continue, #modal-actions .modal-primary, .battle-result-action .modal-primary').first();
  if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(250); return; }
  const card = root.locator('button.card:not(:disabled)').first();
  if (await card.count()) { await card.click(); await page.waitForTimeout(250); return; }
  const end = root.locator('#end-turn:not(:disabled)');
  if (await end.count()) await end.click();
  await page.waitForTimeout(250);
}
