import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import { emptyState, newMonth, STORAGE_KEY, todayMonth, serialize } from '../core.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = await mkdtemp(path.join(os.tmpdir(), 'calendar-setup-qa-'));
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const file = path.resolve(root, '.' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'msedge' });
const errors = [], requests = [];
async function pageFor(state, init) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => requests.push(r.url()));
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('qa-seeded') && value !== undefined) {
      localStorage.setItem(key, value); sessionStorage.setItem('qa-seeded', 'yes');
    }
    window.workerPosts = [];
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      postMessage(data) { window.workerPosts.push(JSON.stringify(data)); super.postMessage({ ...data, timeMs: 30 }); }
    };
  }, { key: STORAGE_KEY, value: typeof state === 'string' ? state : state ? serialize(state) : undefined });
  if (init) await page.addInitScript(init);
  await page.goto(origin);
  return page;
}
const saved = page => page.evaluate(key => localStorage.getItem(key), STORAGE_KEY);
const city = async page => { await page.locator('#setup-city').fill('Girona'); await page.locator('#setup-city').press('Enter'); };
function fixture(withCity = true, count = 1) {
  const s = emptyState(); s.months[todayMonth()] = newMonth();
  if (withCity) { s.cityId = '17079000'; s.months[todayMonth()].cityId = s.cityId; }
  for (let i = 0; i < count; i++) s.participants.push({ id: randomUUID(), code: s.nextCode++, allowedKinds: ['24'], blockedWeekdays: [], blockedDates: [] });
  return s;
}
async function finish(page, count = '3') {
  await page.locator('#setup-count').fill(count);
  await page.locator('#setup-next').click();
  await page.locator('#setup-generate').click();
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Search finished.'));
}
try {
  const page = await pageFor();
  assert(await page.locator('#setup-dialog').isVisible());
  assert.equal(await page.evaluate(() => document.activeElement.id), 'setup-city');
  await page.keyboard.press('Escape'); assert(await page.locator('#setup-dialog').isVisible());
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'setup-import');
  await page.mouse.click(4, 4); assert(await page.locator('#setup-dialog').isVisible());
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => document.querySelector('#setup-dialog').contains(document.activeElement)), 'Focus stays inside setup');
  }
  await page.locator('#setup-city').fill('QA_PRIVATE_INVALID_CITY'); await page.locator('#setup-next').click();
  assert(await page.locator('#setup-error').isVisible()); assert.equal(await saved(page), null);
  await city(page); assert.equal(await page.locator('#setup-progress').textContent(), 'Step 2 of 2');
  await page.locator('#setup-count').fill('7'); await page.locator('#setup-back').click(); await city(page);
  assert.equal(await page.locator('#setup-count').inputValue(), '7');
  assert.equal(JSON.parse(await saved(page)).participants.length, 0, 'Back never creates people');
  for (const count of ['', '0', '1.5', '101']) {
    await page.locator('#setup-count').fill(count); await page.locator('#setup-next').click();
    assert(await page.locator('#setup-error').isVisible());
    assert.equal(JSON.parse(await saved(page)).participants.length, 0);
  }
  await page.screenshot({ path: path.join(output, 'team-step.png') });
  await page.locator('#setup-count').fill('3');
  await page.locator('#setup-next').evaluate(button => { button.click(); button.click(); });
  assert.equal(await page.evaluate(() => window.workerPosts.length), 0, 'Count confirmation never generates before a choice');
  await page.locator('#setup-generate').evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Search finished.'));
  assert(await page.locator('#setup-dialog').isHidden());
  assert.equal(await page.evaluate(() => window.workerPosts.length), 1);
  const data = JSON.parse(await saved(page)); assert.equal(data.participants.length, 3);
  assert(data.participants.every(p => p.allowedKinds.join() === '24' && !p.blockedDates.length && !p.blockedWeekdays.length));
  assert(!(await saved(page)).includes('QA_PRIVATE_INVALID_CITY'));
  assert((await page.locator('#message').textContent()).includes('Next: review'));
  await page.locator('[data-person]').first().click(); await page.locator('#person-name').fill('QA_SETUP_PRIVATE_NAME');
  await page.locator('#confirm-participant').click();
  await page.locator('#generate').click();
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Search finished.'));
  assert(!(await saved(page)).includes('QA_SETUP_PRIVATE_NAME'));
  assert(!(await page.evaluate(() => window.workerPosts.join())).includes('QA_SETUP_PRIVATE_NAME'));
  await page.reload(); assert(await page.locator('#setup-dialog').isHidden());
  assert(!(await page.locator('body').textContent()).includes('QA_SETUP_PRIVATE_NAME'));
  await page.locator('#clear-city').click(); assert(await page.locator('#setup-dialog').isHidden());
  await page.reload(); assert(await page.locator('#setup-city').isVisible());
  await city(page); assert(await page.locator('#setup-dialog').isHidden());
  assert.equal(await page.evaluate(() => window.workerPosts.length), 0, 'Existing team is never regenerated by city confirmation');
  // Filling information visits each person, reuses the draft confirmation boundary, then offers generation.
  const guided = await pageFor(); await city(guided);
  await guided.locator('#setup-count').fill('3'); await guided.locator('#setup-next').click();
  assert.equal(await guided.evaluate(() => window.workerPosts.length), 0);
  await guided.locator('#setup-back').click();
  assert.equal(await guided.locator('#setup-count').inputValue(), '3');
  await guided.locator('#setup-next').click(); await guided.locator('#setup-edit-people').click();
  assert(await guided.locator('#setup-dialog').isHidden()); assert(await guided.locator('#participant-dialog').isVisible());
  assert.equal(await guided.locator('dialog[open]').count(), 1);
  assert((await guided.locator('#participant-setup-progress').textContent()).includes('1 of 3'));
  await guided.locator('#person-name').fill('QA_GUIDED_PRIVATE');
  await guided.locator('[data-kind="24"]').uncheck(); await guided.locator('[data-kind="day"]').check();
  await guided.locator('[data-weekday="1"]').check();
  await guided.locator(`[data-block-date="${todayMonth()}-12"]`).click();
  await guided.locator('#confirm-participant').click();
  assert((await guided.locator('#participant-setup-progress').textContent()).includes('2 of 3'));
  const confirmed = JSON.parse(await saved(guided));
  assert.deepEqual(confirmed.participants[0].allowedKinds, ['day']);
  assert.deepEqual(confirmed.participants[0].blockedWeekdays, [1]);
  assert.deepEqual(confirmed.participants[0].blockedDates, [todayMonth() + '-12']);
  await guided.locator('#person-name').fill('QA_DISCARDED_DRAFT'); await guided.keyboard.press('Escape');
  assert(await guided.locator('#setup-choice-step').isVisible());
  assert.equal(await guided.evaluate(() => window.workerPosts.length), 0);
  await guided.locator('#setup-edit-people').click();
  assert((await guided.locator('#participant-setup-progress').textContent()).includes('2 of 3'));
  assert.equal(await guided.locator('#person-name').inputValue(), '');
  await guided.locator('#cancel-participant').click();
  assert((await guided.locator('#participant-setup-progress').textContent()).includes('3 of 3'));
  assert(await guided.locator('#confirm-participant').isEnabled(), 'Unchanged defaults can be confirmed');
  await guided.locator('#confirm-participant').click();
  assert(await guided.locator('#participant-dialog').isHidden());
  assert((await guided.locator('#setup-title').textContent()).includes('ready'));
  assert.equal(await guided.evaluate(() => window.workerPosts.length), 0, 'Only the explicit generation action starts a search');
  await guided.locator('#setup-generate').click();
  await guided.waitForFunction(() => document.querySelector('#search-status').textContent.includes('Search finished.'));
  assert.equal(JSON.parse(await saved(guided)).participants.length, 3, 'Review never duplicates the team');
  assert(!(await saved(guided)).includes('QA_GUIDED_PRIVATE'));
  assert(!(await guided.evaluate(() => window.workerPosts.join())).includes('QA_GUIDED_PRIVATE'));
  assert(!(await guided.locator('body').textContent()).includes('QA_DISCARDED_DRAFT'));
  await guided.screenshot({ path: path.join(output, 'guided-completed.png') });
  // Existing anonymous rota without a city stays intact, including other months.
  const legacy = fixture(false);
  legacy.months[todayMonth()].assignments.push({ date: todayMonth() + '-02', kind: '24', seat: 0, participantId: legacy.participants[0].id, fixed: false, override: false });
  const old = await pageFor(legacy); await city(old);
  assert.deepEqual(JSON.parse(await saved(old)).months[todayMonth()].assignments, legacy.months[todayMonth()].assignments);
  assert.equal(await old.evaluate(() => window.workerPosts.length), 0);
  const teamOnly = await pageFor(fixture(true, 0)); assert(await teamOnly.locator('#setup-team-step').isVisible());
  await finish(teamOnly, '1');
  const largest = await pageFor(fixture(true, 0)); await finish(largest, '100');
  assert.equal(JSON.parse(await saved(largest)).participants.length, 100);
  // Import is accessible while blocked, handles cancellation/invalid files, and resumes missing steps.
  const importer = await pageFor();
  await importer.locator('#setup-import').click();
  await importer.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{}') });
  assert(await importer.locator('#setup-error').isVisible()); assert(await importer.locator('#setup-dialog').isVisible());
  importer.once('dialog', d => d.dismiss());
  await importer.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(serialize(legacy)) });
  assert.equal(await saved(importer), null);
  importer.once('dialog', d => d.accept());
  await importer.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(serialize(fixture(true, 0))) });
  await importer.locator('#setup-team-step').waitFor({ state: 'visible' }); await finish(importer, '2');
  importer.once('dialog', d => d.accept());
  await importer.locator('#import-file').setInputFiles({ name: 'ready.json', mimeType: 'application/json', buffer: Buffer.from(serialize(fixture())) });
  assert(await importer.locator('#setup-dialog').isHidden());
  await importer.locator('[data-person]').click();
  importer.once('dialog', d => d.accept());
  await importer.locator('#import-file').setInputFiles({ name: 'empty.json', mimeType: 'application/json', buffer: Buffer.from(serialize(emptyState())) });
  assert(await importer.locator('#setup-dialog').isVisible());
  assert(await importer.locator('#participant-dialog').isHidden());
  assert.equal(await importer.locator('dialog[open]').count(), 1);
  // Last participant deletion does not force setup until the next visit.
  const deletion = await pageFor(fixture()); await deletion.locator('[data-person]').click();
  deletion.once('dialog', d => d.accept()); await deletion.locator('#remove-person').click();
  assert(await deletion.locator('#setup-dialog').isHidden());
  await deletion.reload(); assert(await deletion.locator('#setup-team-step').isVisible());
  // Corrupt storage is never overwritten and recovery failures remain visible.
  const broken = await pageFor('{broken'); assert(await broken.locator('#setup-recovery').isVisible());
  assert.equal(await saved(broken), '{broken');
  await broken.evaluate(() => { window.realRemove = Storage.prototype.removeItem; Storage.prototype.removeItem = () => { throw new Error('Unavailable'); }; });
  broken.once('dialog', d => d.accept()); await broken.locator('#setup-restart').click();
  assert.equal(await saved(broken), '{broken'); assert((await broken.locator('#setup-error').textContent()).includes('Nothing was reset'));
  await broken.evaluate(() => { Storage.prototype.removeItem = window.realRemove; });
  broken.once('dialog', d => d.accept()); await broken.locator('#setup-restart').click();
  assert.equal(await saved(broken), null); assert(await broken.locator('#setup-city').isVisible());
  // Read failures offer recovery too; write failures still permit in-memory setup.
  const readFailed = await pageFor(undefined, () => { Storage.prototype.getItem = () => { throw new Error('Unavailable'); }; });
  assert(await readFailed.locator('#setup-recovery').isVisible());
  const writeFailed = await pageFor(undefined, () => { Storage.prototype.setItem = () => { throw new Error('Unavailable'); }; });
  await city(writeFailed); assert((await writeFailed.locator('#setup-error').textContent()).includes('Saving is unavailable'));
  await finish(writeFailed, '1'); assert(await writeFailed.locator('#setup-dialog').isHidden());
  assert.equal(await writeFailed.locator('[data-person]').count(), 1); assert.equal(await saved(writeFailed), null);
  assert((await writeFailed.locator('#save-status').textContent()).includes('Not saved'));
  const future = await pageFor(undefined, () => { const NativeDate = Date; window.Date = class extends NativeDate { constructor(...args) { super(...(args.length ? args : ['2027-01-10T12:00:00Z'])); } }; });
  await city(future); assert(await future.locator('#setup-data-warning').isVisible());
  // Mobile popup fits the viewport and keyboard focus remains usable.
  const mobile = await pageFor(); await mobile.setViewportSize({ width: 390, height: 740 });
  const box = await mobile.locator('#setup-dialog').boundingBox();
  assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= 390 && box.y + box.height <= 740);
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.screenshot({ path: path.join(output, 'city-mobile.png') });
  await city(mobile); await mobile.locator('#setup-count').fill('3'); await mobile.locator('#setup-next').click();
  const choiceBox = await mobile.locator('#setup-dialog').boundingBox();
  assert(choiceBox.x >= 0 && choiceBox.y >= 0 && choiceBox.x + choiceBox.width <= 390 && choiceBox.y + choiceBox.height <= 740);
  await mobile.screenshot({ path: path.join(output, 'choice-mobile.png') });
  assert(requests.every(url => url.startsWith(origin) || url.startsWith('blob:')));
  assert.deepEqual(errors, []);
  console.log('Setup browser checks passed: city/team steps, validation, focus, defaults, one generation, saved users, imports, restart, recovery, privacy, and mobile.');
  console.log(`Synthetic QA output: ${output}`);
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
