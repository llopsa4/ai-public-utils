import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
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
  for (let i = 0; i < 5; i++) state.participants.push({ id: randomUUID(), code: state.nextCode++, allowedKinds: ['24'], blockedWeekdays: [], blockedDates: [] });
  state.participants[0].allowedKinds = [kind];
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
  const markup = await readFile(path.join(root, 'index.html'), 'utf8');
  for (const asset of ['app.mjs', 'styles.css', 'theme.css']) {
    const hash = createHash('sha256').update(await readFile(path.join(root, asset))).digest('hex').slice(0, 12);
    assert(markup.includes(`./${asset}?v=${hash}`), `${asset} URL must change with its contents to prevent mixed cached versions`);
  }
  // A preview reload must not reuse the old entry script after its DOM targets were removed.
  const stalePage = await browser.newPage();
  await stalePage.route('**/app.mjs', route => route.fulfill({ contentType: 'text/javascript', body: "document.querySelector('#metrics').innerHTML = 'stale summary code';" }));
  await stalePage.goto(origin, { waitUntil: 'networkidle' });
  assert.ok(await stalePage.locator('.day-cell').count() >= 28, 'Calendar must render even when the browser caches the previous unversioned app script');
  await stalePage.close();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  const errors = [], requests = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => requests.push(r.url()));
  const state = fixture();
  // Participant view is a non-persistent filter and keeps move/cancel actions usable.
  const viewState = fixture();
  viewState.months['2026-10'].assignments.push(
    { ...viewState.months['2026-10'].assignments[0], participantId: viewState.participants[1].id, seat: 1 },
    { ...viewState.months['2026-10'].assignments[0], participantId: viewState.participants[1].id, date: '2026-10-07' },
    { ...viewState.months['2026-10'].assignments[0], date: '2026-10-09' }
  );
  await seed(page, viewState);
  const beforeView = await stored(page);
  await page.locator('#participant-view').selectOption(viewState.participants[0].id);
  assert.equal(await stored(page), beforeView);
  assert.equal(await page.locator('#month-grid [data-move]').count(), 2);
  assert.equal(await page.locator('.participant-workday').count(), 2);
  assert.equal(await page.locator('#month-grid .pending').count(), 0);
  assert.equal(await page.locator('[data-date="2026-10-07"] [data-move]').count(), 0);
  assert((await page.locator('#participant-view-status').textContent()).includes('2 workdays'));
  const beforePrint = await stored(page);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('.print-page').count(), 1, 'Print the selected view only');
  assert.equal(await page.locator('.print-shift').count(), 2, 'Individual PDF hides other participants and unfilled spots');
  assert.equal(await page.locator('.print-day.participant-workday').count(), 2);
  assert.equal(await page.locator('.print-day.participant-workday').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(223, 241, 231)');
  await page.pdf({ path: path.join(output, 'individual-view.pdf'), preferCSSPageSize: true, printBackground: true });
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  assert.equal(await page.locator('#print-report').textContent(), '');
  assert.equal(await stored(page), beforePrint, 'Printing never changes saved scheduling data');
  await page.emulateMedia({ media: 'screen' });

  await page.locator('[data-move="2026-10-05/24/0"]').click();
  await page.locator('#choose-move').click();
  assert(await page.locator('#participant-view').isDisabled());
  await page.locator('[data-drop="2026-10-07/24/1"]').click();
  assert.equal(await page.locator('[data-date="2026-10-05"] [data-move]').count(), 0);
  assert.equal(await page.locator('[data-date="2026-10-07"] [data-move]').count(), 1);
  await page.locator('[data-move="2026-10-09/24/0"]').click();
  await page.locator('#cancel-assignment').click();
  assert.equal(await page.locator('.participant-workday').count(), 1);
  await page.locator('#participant-view').selectOption(viewState.participants[2].id);
  assert.equal(await page.locator('#month-grid [data-move]').count(), 0);
  assert((await page.locator('#participant-view-status').textContent()).includes('0 workdays'));
  await page.locator('[data-person]').nth(2).click();
  page.once('dialog', d => d.accept()); await page.locator('#remove-person').click();
  assert.equal(await page.locator('#participant-view').inputValue(), '');
  assert.equal(await page.locator('#month-grid [data-move]').count(), 3);
  await page.locator('#participant-view').selectOption(viewState.participants[0].id);
  await page.reload(); assert.equal(await page.locator('#participant-view').inputValue(), '');
  await seed(page, state);
  const key = '2026-10-05/24/0';
  // Keyboard selection, target focus, cancellation, and manual moves.
  await page.locator(`[data-move="${key}"]`).focus();
  await page.keyboard.press('Enter');
  assert(await page.locator('#assignment-dialog').isVisible());
  assert.equal(await page.locator('[data-drop]').count(), 0, 'Opening options must not start moving');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#assignment-dialog').isVisible(), false);
  assert.deepEqual(JSON.parse(await stored(page)).months['2026-10'].assignments, state.months['2026-10'].assignments);
  await page.keyboard.press('Enter');
  await page.locator('#choose-move').click();
  assert(await page.locator('#generate').isDisabled());
  assert(await page.locator('#next').isDisabled());
  assert(await page.locator('#month-input').isDisabled());
  assert(await page.locator('[data-drop]').count() > 0);
  assert(await page.evaluate(() => document.activeElement.hasAttribute('data-drop')));
  await page.keyboard.press('Escape');
  assert.equal(await page.locator(`[data-move="${key}"]`).evaluate(el => document.activeElement === el), true);
  assert.deepEqual(JSON.parse(await stored(page)).months['2026-10'].assignments, state.months['2026-10'].assignments);
  await page.keyboard.press('Enter');
  await page.locator('#choose-move').click();
  await page.locator('[data-drop="2026-10-07/24/0"]').focus(); await page.keyboard.press('Enter');
  const moved = JSON.parse(await stored(page)).months['2026-10'].assignments;
  assert.equal(moved.length, 1); assert.equal(moved[0].date, '2026-10-07'); assert(!moved[0].fixed); assert(!moved[0].override);
  assert.equal(await page.locator('[data-move="2026-10-07/24/0"]').evaluate(el => document.activeElement === el), true);
  assert(await page.locator('#generate').isEnabled());
  await page.locator('[data-date="2026-10-07"] .date-open').click();
  assert.equal(await page.locator('#day-dialog').evaluate(el => el.open), true);
  await page.getByRole('button', { name: 'Close date editor' }).click();

  // Cancel assignment removes the duty, updates coverage, and restores focus to its date.
  await seed(page, state);
  await page.locator(`[data-move="${key}"]`).click();
  await page.locator('#cancel-assignment').click();
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments.length, 0);
  assert(await page.locator('[data-date="2026-10-05"]').evaluate(el => el.classList.contains('unfilled')));
  assert(await page.locator('[data-date="2026-10-05"] .date-open').evaluate(el => el === document.activeElement));
  assert(await page.locator('#assignment-dialog').isHidden());

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

  // Date-popup choices require per-spot confirmation, including clearing a duty.
  state.participants[2].blockedDates = ['2026-10-07'];
  await seed(page, state);
  const beforePopup = await stored(page);
  await page.locator('[data-date="2026-10-07"] .date-open').click();
  await page.locator('[data-assign="24/0"]').selectOption(state.participants[1].id);
  assert.equal(await stored(page), beforePopup);
  await page.locator('[data-cancel-assign="24/0"]').click();
  assert.equal(await page.locator('[data-assign="24/0"]').inputValue(), '');
  await page.locator('[data-assign="24/0"]').selectOption(state.participants[1].id);
  await page.keyboard.press('Escape');
  assert.equal(await stored(page), beforePopup);
  await page.locator('[data-date="2026-10-07"] .date-open').click();
  assert.equal(await page.locator('[data-assign="24/0"]').inputValue(), '');
  await page.locator('[data-assign="24/0"]').selectOption(state.participants[1].id);
  await page.locator('[data-confirm-assign="24/0"]').press('Enter');
  const assignedPopup = await stored(page);
  assert.equal(JSON.parse(assignedPopup).months['2026-10'].assignments.length, 2);
  await page.locator('[data-assign="24/0"]').selectOption('');
  assert.equal(await stored(page), assignedPopup);
  await page.locator('[data-cancel-assign="24/0"]').click();
  assert.equal(await page.locator('[data-assign="24/0"]').inputValue(), state.participants[1].id);
  await page.locator('[data-assign="24/0"]').selectOption('');
  await page.locator('[data-confirm-assign="24/0"]').click();
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments.length, 1);
  // A second pending spot must be revalidated after the first is confirmed.
  await page.locator('[data-assign="24/0"]').selectOption(state.participants[1].id);
  await page.locator('[data-assign="24/1"]').selectOption(state.participants[1].id);
  await page.locator('[data-confirm-assign="24/0"]').click();
  const beforeConflict = await stored(page);
  await page.locator('[data-confirm-assign="24/1"]').click();
  assert.equal(await stored(page), beforeConflict);
  assert((await page.locator('#day-content').textContent()).includes('Not applied:'));
  await page.locator('[data-cancel-assign="24/1"]').click();
  await page.locator('[data-assign="24/1"]').selectOption(state.participants[2].id);
  page.once('dialog', d => d.dismiss());
  await page.locator('[data-confirm-assign="24/1"]').click();
  assert.equal(await stored(page), beforeConflict);
  page.once('dialog', d => d.accept());
  await page.locator('[data-confirm-assign="24/1"]').click();
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments.at(-1).override, true);
  await page.getByRole('button', { name: 'Close date editor' }).click();

  // Short-shift previews never mutate storage until a destination is committed.
  const short = fixture('day', '2026-10-03');
  await seed(page, short); const before = await stored(page);
  await page.locator('[data-move="2026-10-03/day/0"]').click();
  await page.locator('#choose-move').click();
  assert.equal(await page.locator('[data-date="2026-10-10"] [data-drop]').count(), 2);
  assert.equal(await page.locator('[data-date="2026-10-05"] [data-drop]').count(), 0);
  assert.equal(await stored(page), before);
  await page.screenshot({ path: path.join(output, 'move-targets.png'), fullPage: true });
  await page.locator('#cancel-move').click();
  assert.equal(await page.locator('[data-date="2026-10-10"] .slot-kind').first().textContent(), '24h');
  await page.locator('[data-move="2026-10-03/day/0"]').click();
  await page.locator('#choose-move').click();
  await page.locator('[data-drop="2026-10-10/day/0"]').click();
  assert.equal(JSON.parse(await stored(page)).months['2026-10'].assignments[0].kind, 'day');
  assert.equal(await page.locator('[data-date="2026-10-03"] .slot-kind').first().textContent(), '24h');
  assert.equal(await page.locator('[data-date="2026-10-10"] .slot-kind').count(), 3);

  // Rule-invalid destinations do not become drop controls. Source names stay private.
  state.participants[0].blockedDates = ['2026-10-07'];
  await seed(page, state);
  await page.locator('[data-person]').first().click();
  await page.locator('#person-name').fill('QA_MOVE_PRIVATE_SENTINEL');
  await page.locator('#confirm-participant').click();
  await page.locator(`[data-move="${key}"]`).click();
  await page.locator('#choose-move').click();
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
  assert.equal(await red.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(139, 41, 51)');
  assert((await red.textContent()).includes('Needs cover'));
  assert((await red.textContent()).includes('Overstaffed / overlapping coverage'));
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  const printDay = page.locator('.print-page').first().locator('.print-day.overstaffed');
  assert.equal(await printDay.evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(139, 41, 51)');
  assert((await printDay.textContent()).includes('Missing coverage'));
  assert(await printDay.evaluate(el => el.scrollHeight <= el.clientHeight), 'Print warnings and shifts must fit inside the date');
  await page.screenshot({ path: path.join(output, 'print.png'), fullPage: true });
  await page.pdf({ path: path.join(output, 'overlap.pdf'), format: 'A4', landscape: true, printBackground: true });
  await page.emulateMedia({ media: 'screen' });
  await page.screenshot({ path: path.join(output, 'overlap.png'), fullPage: true });
  // The previously hidden incompatible entry is movable, allowing the overlap to be repaired.
  await page.locator('[data-move="2026-10-03/24/0"]').click();
  await page.locator('#choose-move').click();
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
  await mobile.locator(`[data-move="${key}"]`).tap();
  assert(await mobile.locator('#assignment-dialog').isVisible());
  await mobile.getByRole('button', { name: 'Close assignment options' }).tap();
  assert.deepEqual(JSON.parse(await stored(mobile)).months['2026-10'].assignments, mobileState.months['2026-10'].assignments);
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

  // Legacy mixed permissions migrate once without losing an existing short duty.
  const legacy = fixture('day', '2026-10-03');
  legacy.participants[0].allowedKinds = ['24', 'day', 'night'];
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: JSON.stringify(legacy) });
  await page.reload();
  await page.locator('#month-input').fill('2026-10'); await page.locator('#month-input').dispatchEvent('change');
  let migrated = JSON.parse(await stored(page));
  assert.deepEqual(migrated.participants[0].allowedKinds, ['24']);
  assert.deepEqual(migrated.months['2026-10'].assignments, legacy.months['2026-10'].assignments);
  assert((await page.locator('#message').textContent()).includes('mixed shift permissions now default'));
  await page.locator('[data-person]').first().click();
  assert(await page.locator('[data-kind="24"]').isChecked());
  assert(await page.locator('[data-kind="day"]').isDisabled());
  await page.locator('[data-kind="24"]').uncheck();
  await page.locator('[data-kind="day"]').check();
  await page.locator('[data-kind="night"]').check();
  assert.equal(await page.locator('[data-kind="24"]').isChecked(), false);
  assert.deepEqual(JSON.parse(await stored(page)).participants[0].allowedKinds, ['24'], 'Exclusive settings still require confirmation');
  await page.locator('#confirm-participant').click();
  assert.deepEqual(JSON.parse(await stored(page)).participants[0].allowedKinds, ['day', 'night']);
  await page.locator('[data-date="2026-10-10"] .date-open').click();
  await page.locator('[data-split="0"]').click();
  await page.locator('[data-assign="night/0"]').selectOption(legacy.participants[0].id);
  await page.locator('[data-confirm-assign="night/0"]').click();
  migrated = JSON.parse(await stored(page));
  assert.equal(migrated.months['2026-10'].assignments.length, 2);
  assert(migrated.months['2026-10'].assignments.every(a => !a.override), 'Two 12-hour holiday duties need no exception');
  await page.getByRole('button', { name: 'Close date editor' }).click();
  assert((await page.locator('#workloads tr').first().textContent()).includes('2 / 2'));
  assert((await page.locator('#workloads tr').first().textContent()).includes('24 / 24h'));
  await page.locator('[data-date="2026-10-17"] .date-open').click();
  await page.locator('[data-split="0"]').click();
  await page.locator('[data-assign="day/0"]').selectOption(legacy.participants[0].id);
  const beforeThird = await stored(page);
  page.once('dialog', d => { assert(d.message().includes('Monthly holiday limit exceeded')); return d.dismiss(); });
  await page.locator('[data-confirm-assign="day/0"]').click();
  assert.equal(await stored(page), beforeThird);
  await page.getByRole('button', { name: 'Close date editor' }).click();
  // Restart clears only this planner, including every month, and can be declined.
  const restartState = fixture();
  restartState.cityId = '17079000'; restartState.months['2026-10'].cityId = restartState.cityId;
  restartState.months['2026-09'] = { holidays: ['2026-09-02'], assignments: [{ ...restartState.months['2026-10'].assignments[0], date: '2026-09-04' }] };
  await seed(page, restartState);
  await page.evaluate(() => localStorage.setItem('other-app.restart-test', 'keep'));
  await page.locator('[data-person]').first().click();
  await page.locator('#person-name').fill('QA_RESTART_PRIVATE_SENTINEL');
  await page.locator('#confirm-participant').click();
  await page.locator('[data-date="2026-10-05"] .date-open').click();
  await page.getByRole('button', { name: 'Close date editor' }).click();
  const beforeRestart = await stored(page);
  await page.locator('#participant-view').selectOption(restartState.participants[0].id);
  page.once('dialog', d => d.dismiss()); await page.locator('#restart').click();
  assert.equal(await stored(page), beforeRestart);
  assert((await page.locator('body').textContent()).includes('QA_RESTART_PRIVATE_SENTINEL'));
  // Failure to clear storage must preserve the entire current planner.
  await page.evaluate(() => { window.originalRemoveItem = Storage.prototype.removeItem; Storage.prototype.removeItem = () => { throw new Error('Storage unavailable'); }; });
  page.once('dialog', d => d.accept()); await page.locator('#restart').click();
  assert.equal(await stored(page), beforeRestart);
  assert((await page.locator('#message').textContent()).includes('Nothing was reset'));
  await page.evaluate(() => { Storage.prototype.removeItem = window.originalRemoveItem; delete window.originalRemoveItem; });
  page.once('dialog', d => d.accept()); await page.locator('#restart').click();
  assert.equal(await stored(page), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('other-app.restart-test')), 'keep');
  assert.equal(await page.locator('[data-person]').count(), 0);
  assert.equal(await page.locator('#city-input').inputValue(), '');
  assert.equal(await page.locator('#city-highlight').textContent(), 'No city selected');
  assert.equal(await page.locator('#participant-view').inputValue(), '');
  assert(!(await page.locator('body').textContent()).includes('QA_RESTART_PRIVATE_SENTINEL'));
  assert.equal(await page.locator('.day-cell:not(.unfilled)').count(), 0);
  await page.reload();
  assert.equal(await stored(page), null);
  assert.equal(await page.locator('[data-person]').count(), 0);
  // Codes restart at P001 and an active search can be terminated by restarting.
  await page.locator('#add-participant').click();
  assert.equal(JSON.parse(await stored(page)).participants[0].code, 1);
  await page.locator('#generate').click();
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Best coverage:'));
  assert(await page.locator('#restart').isEnabled());
  page.once('dialog', d => d.accept()); await page.locator('#restart').click();
  await page.waitForTimeout(250);
  assert.equal(await stored(page), null);
  assert(await page.locator('#search-status').isHidden());
  assert(await page.locator('#generate').isEnabled());
  assert.equal(await page.locator('[data-person]').count(), 0);
  // Explicit restart also recovers from previously unreadable saved data.
  await page.evaluate(key => localStorage.setItem(key, '{broken'), STORAGE_KEY);
  await page.reload();
  page.once('dialog', d => d.accept()); await page.locator('#restart').click();
  assert.equal(await stored(page), null);
  await page.locator('#add-participant').click();
  assert.equal(JSON.parse(await stored(page)).participants[0].code, 1);
  assert(requests.every(url => url.startsWith(origin) || url.startsWith('blob:')));
  assert.deepEqual(errors, []);
  console.log('Move browser checks passed: mouse, touch hold/swipe, keyboard, focus, cancellation, previews, privacy, red overlap warnings, and print.');
  console.log(`Synthetic QA output: ${output}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
