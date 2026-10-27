import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import { emptyState, newMonth, KINDS, STORAGE_KEY, serialize } from '../core.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = await mkdtemp(path.join(os.tmpdir(), 'calendar-moves-qa-'));
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const content = await readFile(file);
    res.setHeader('Content-Type', { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)] ?? 'application/octet-stream');
    res.end(content);
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
function fixture(kind = '24', date = '2026-10-05') {
  const state = emptyState(); state.months['2026-10'] = newMonth();
  for (let i = 0; i < 5; i++) state.participants.push({ id: randomUUID(), code: state.nextCode++, allowedKinds: [...KINDS], blockedWeekdays: [], blockedDates: [] });
  state.months['2026-10'].assignments.push({ date, kind, seat: 0, participantId: state.participants[0].id, fixed: false, override: false });
  return state;
}
async function seed(page, state) {
  await page.goto(origin);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: serialize(state) });
  await page.reload();
  await page.locator('#month-input').fill('2026-10');
  await page.locator('#month-input').dispatchEvent('change');
}
const stored = page => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
async function point(locator) {
  await locator.scrollIntoViewIfNeeded(); const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
async function startDrag(page, key) {
  const p = await point(page.locator(`[data-move="${key}"]`));
  await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.mouse.move(p.x + 9, p.y);
  await page.locator('#move-controls').waitFor({ state: 'visible' });
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => requests.push(r.url()));
  const state = fixture();
  await seed(page, state);
  const key = '2026-10-05/24/0';
  // Keyboard selection, target focus, cancellation, and fixed manual moves.
  await page.locator(`[data-move="${key}"]`).focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('#generate').isDisabled());
  assert(await page.locator('#next').isDisabled());
  assert(await page.locator('#month-input').isDisabled());
  assert(await page.locator('[data-drop]').count() > 0);
  assert(await page.evaluate(() => document.activeElement.hasAttribute('data-drop')));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator(`[data-move="${key}"]`).evaluate(el => document.activeElement === el), true);
  assert.deepEqual(JSON.parse(await stored(page)).months['2026-10'].assignments, state.months['2026-10'].assignments);
  await page.keyboard.press('Enter');
  await page.locator('[data-drop="2026-10-07/24/0"]').focus(); await page.keyboard.press('Enter');
  const moved = JSON.parse(await stored(page)).months['2026-10'].assignments;
  assert.equal(moved.length, 1); assert.equal(moved[0].date, '2026-10-07'); assert(moved[0].fixed); assert(!moved[0].override);
  assert.equal(await page.locator('[data-move="2026-10-07/24/0"]').evaluate(el => document.activeElement === el), true);
  assert(await page.locator('#generate').isEnabled());
  await page.locator('[data-date="2026-10-07"] .date-open').click();
  assert.equal(await page.locator('#day-dialog').evaluate(el => el.open), true);
  await page.getByRole('button', { name: 'Close date editor' }).click();

  // Real mouse pointer sequence, invalid drop, and cancellation preserve origin.
  await seed(page, state);
  await startDrag(page, key);
  const dest = await point(page.locator('[data-drop="2026-10-07/24/1"]'));
  await page.mouse.move(dest.x, dest.y); await page.mouse.up();
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments[0].seat, 1);
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments[0].date, '2026-10-07');
  await seed(page, state); await startDrag(page, key);
  await page.mouse.move(2, 2); await page.mouse.up();
  assert.deepEqual(JSON.parse(await stored(page)).months['2026-10'].assignments, state.months['2026-10'].assignments);
  await page.waitForTimeout(460);
  await startDrag(page, key); await page.keyboard.press('Escape'); await page.mouse.up();
  assert(await page.locator('#move-controls').isHidden());
  assert(await page.locator('#move-cursor').isHidden());

  // Short-shift previews never mutate storage until a destination is committed.
  const short = fixture('day', '2026-10-03');
  await seed(page, short); const before = await stored(page);
  await page.locator('[data-move="2026-10-03/day/0"]').click();
  assert.equal(await page.locator('[data-date="2026-10-10"] [data-drop]').count(), 2);
  assert.equal(await page.locator('[data-date="2026-10-05"] [data-drop]').count(), 0);
  assert.equal(await stored(page), before);
  await page.screenshot({ path: path.join(output, 'move-targets.png'), fullPage: true });
  await page.locator('#cancel-move').click();
  assert.equal(await page.locator('[data-date="2026-10-10"] .slot-kind').first().textContent(), '24h');
  await page.locator('[data-move="2026-10-03/day/0"]').click();
  await page.locator('[data-drop="2026-10-10/day/0"]').click();
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments[0].kind, 'day');
  assert.equal(await page.locator('[data-date="2026-10-03"] .slot-kind').first().textContent(), '24h');
  assert.equal(await page.locator('[data-date="2026-10-10"] .slot-kind').count(), 3);

  // Rule-invalid destinations do not become drop controls. Source names stay private.
  state.participants[0].blockedDates = ['2026-10-07'];
  await seed(page, state);
  await page.locator('[data-person]').first().click();
  await page.locator('#person-name').fill('QA_MOVE_PRIVATE_SENTINEL');
  await page.locator(`[data-move="${key}"]`).click();
  assert.equal(await page.locator('[data-date="2026-10-07"] [data-drop]').count(), 0);
  assert(!(await stored(page)).includes('QA_MOVE_PRIVATE_SENTINEL'));
  await page.locator('#cancel-move').click();
  const downloadEvent = page.waitForEvent('download'); await page.locator('#backup').click();
  const download = await downloadEvent;
  assert(!(await readFile(await download.path(), 'utf8')).includes('QA_MOVE_PRIVATE_SENTINEL'));
  await page.reload(); assert(!(await page.locator('body').textContent()).includes('QA_MOVE_PRIVATE_SENTINEL'));

  // Imported overlap is red even with missing coverage, including print output.
  const overlap = fixture('24', '2026-10-03');
  overlap.months['2026-10'].assignments.push({ ...overlap.months['2026-10'].assignments[0], participantId: overlap.participants[1].id, kind: 'day' });
  await seed(page, overlap);
  const red = page.locator('[data-date="2026-10-03"]');
  assert(await red.evaluate(el => el.classList.contains('overstaffed') && el.classList.contains('unfilled')));
  assert.equal(await red.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 214, 208)');
  assert((await red.textContent()).includes('Needs cover'));
  assert((await red.textContent()).includes('Overstaffed / overlapping coverage'));
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const printDay = page.locator('.print-page').first().locator('.print-day.overstaffed');
  assert.equal(await printDay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 214, 208)');
  assert((await printDay.textContent()).includes('Missing coverage'));
  assert(await printDay.evaluate(el => el.scrollHeight <= el.clientHeight), 'Print warnings and shifts must fit inside the date');
  await page.screenshot({ path: path.join(output, 'print.png'), fullPage: true });
  await page.pdf({ path: path.join(output, 'overlap.pdf'), format: 'A4', landscape: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.screenshot({ path: path.join(output, 'overlap.png'), fullPage: true });
  // The previously hidden incompatible entry is movable, allowing the overlap to be repaired.
  await page.locator('[data-move="2026-10-03/24/0"]').click();
  await page.locator('[data-drop="2026-10-05/24/0"]').click();
  assert.equal(await page.locator('.day-cell.overstaffed').count(), 0);
  await page.locator('#generate').click();
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Best coverage:'));
  assert.equal(await page.locator('[data-move]:enabled').count(), 0, 'Generation disables assignment moves');
  await page.locator('#cancel').click();

  // Touch uses real browser input: a swipe scrolls, while a held duty moves.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await context.newPage(), cdp = await context.newCDPSession(mobile);
  const mobileState = fixture(); await seed(mobile, mobileState);
  const touch = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p.x, y: p.y, id: 1 }] : [] });
  let p = await point(mobile.locator(`[data-move="${key}"]`));
  const scroll = await mobile.evaluate(() => scrollY);
  await touch('touchStart', p); await touch('touchMove', { x: p.x, y: p.y - 65 }); await touch('touchEnd');
  assert(await mobile.locator('#move-controls').isHidden());
  assert((await mobile.evaluate(() => scrollY)) > scroll);
  await mobile.waitForTimeout(460);
  p = await point(mobile.locator(`[data-move="${key}"]`));
  await touch('touchStart', p); await mobile.waitForTimeout(350); await touch('touchCancel');
  assert(await mobile.locator('#move-controls').isHidden());
  assert.deepEqual(JSON.parse(await stored(mobile)).months['2026-10'].assignments, mobileState.months['2026-10'].assignments);
  p = await point(mobile.locator(`[data-move="${key}"]`));
  await touch('touchStart', p); await mobile.waitForTimeout(350);
  assert(await mobile.locator('#move-controls').isVisible());
  const spot = await point(mobile.locator('[data-drop="2026-10-07/24/0"]'));
  await touch('touchMove', spot); await touch('touchEnd');
  assert.equal(JSON.parse(await stored(mobile)).months['2026-10'].assignments[0].date, '2026-10-07');
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: path.join(output, 'mobile.png'), fullPage: true });
  await context.close();
  assert(requests.every(url => url.startsWith(origin) || url.startsWith('blob:')));
  assert.deepEqual(errors, []);
  console.log('Move browser checks passed: mouse, touch hold/swipe, keyboard, focus, cancellation, previews, privacy, red overlap warnings, and print.');
  console.log(`Synthetic QA output: ${output}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
