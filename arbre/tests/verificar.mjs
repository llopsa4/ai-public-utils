import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createDecipheriv, pbkdf2Sync } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptDocument, readOnlyDocument, scriptHashes, AAD } from '../scripts/preparar.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
await mkdir(resolve(root, 'tmp'), { recursive: true });
let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, '');
assert(password, 'Passa la contrasenya de prova per stdin.');

function decrypt(envelope, value) {
  const key = pbkdf2Sync(value, Buffer.from(envelope.salt, 'base64'), envelope.iterations, 32, 'sha256');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAAD(Buffer.from(AAD));
  const bytes = Buffer.from(envelope.data, 'base64');
  decipher.setAuthTag(bytes.subarray(-16));
  try { return Buffer.concat([decipher.update(bytes.subarray(0,-16)), decipher.final()]).toString('utf8'); }
  finally { key.fill(0); }
}

const envelope = JSON.parse(await readFile(resolve(root, 'dades.xifrades.json'), 'utf8'));
const html = decrypt(envelope, password);
assert.throws(() => decrypt(envelope, password + '-incorrecta'), 'Una contrasenya incorrecta ha de fallar.');
const bytes = Buffer.from(envelope.data, 'base64'); bytes[20] ^= 1;
assert.throws(() => decrypt({ ...envelope, data: bytes.toString('base64') }, password), 'Cal detectar modificacions del contingut xifrat.');
const sample1 = encryptDocument('exemple', 'contrasenya de prova');
const sample2 = encryptDocument('exemple', 'contrasenya de prova');
assert(sample1.salt !== sample2.salt && sample1.iv !== sample2.iv && sample1.data !== sample2.data, 'Cada generació necessita sal i IV nous.');
const privateData = JSON.parse(html.match(/<script type="application\/json" id="tree-data">([\s\S]*?)<\/script>/)[1]);
assert(!['applyEdit', 'personName', 'Desar còpia', 'contenteditable', 'a.download'].some(marker => html.includes(marker)), 'No hi pot haver edició a la versió de consulta.');
const index = await readFile(resolve(root, 'index.html'), 'utf8');
for (const hash of scriptHashes(html)) assert(index.includes(hash), 'El hash CSP ha de correspondre al document desxifrat.');

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', 'arbre'], { cwd: resolve(root, '..'), encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
assert(!files.some(file => file.startsWith('arbre/local/')), 'Les fonts privades han d’estar excloses de Git.');
for (const path of files) {
  const contents = await readFile(resolve(root, '..', path), 'utf8');
  assert(!contents.includes(password), 'La contrasenya no es pot versionar.');
  for (const person of privateData.people.filter(p => p.name.length >= 8)) {
    assert(!contents.includes(person.name), 'Hi ha dades personals en clar en un fitxer publicable.');
  }
}

const routes = new Map([
  ['/arbre/', ['index.html', 'text/html; charset=utf-8']],
  ['/arbre/acces.js', ['acces.js', 'text/javascript; charset=utf-8']],
  ['/arbre/acces.css', ['acces.css', 'text/css; charset=utf-8']],
  ['/arbre/icon.svg', ['icon.svg', 'image/svg+xml']],
  ['/arbre/dades.xifrades.json', ['dades.xifrades.json', 'application/json']],
]);
const server = createServer(async (request, response) => {
  const route = routes.get(new URL(request.url, 'http://localhost').pathname);
  if (!route) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' });
  response.end(await readFile(resolve(root, route[0])));
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}/arbre/`;
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { ({ chromium } = require(resolve(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'))); }
const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url);
  assert(await page.locator('#login').isVisible());
  assert(await page.locator('#tree').count() === 1 && !await page.locator('#tree').getAttribute('src'));
  await page.locator('#password').fill('incorrecta'); await page.locator('#submit').click();
  await page.waitForFunction(() => document.getElementById('message').textContent.includes('incorrecta'));
  assert(!await page.locator('#viewer').isVisible(), 'Una contrasenya incorrecta no pot obrir el visor.');
  await page.locator('#password').fill(password); await page.locator('#submit').click();
  await page.locator('#viewer').waitFor({ state: 'visible' });
  const frame = page.frameLocator('#tree');
  await frame.locator('.person').first().waitFor();
  assert(await frame.locator('.person').count() === privateData.people.length);
  assert(await frame.locator('#save,#applyEdit,textarea,[contenteditable="true"]').count() === 0);
  await frame.locator('#search').fill(privateData.people[0].name);
  await frame.locator('#results button').first().click();
  await frame.locator('.person.highlight').click();
  assert(await frame.locator('#drawer').isVisible());
  assert(await frame.locator('#drawer input,#drawer textarea').count() === 0);
  await frame.locator('#closeDrawer').click();
  const oldZoom = await frame.locator('#zoomLabel').textContent();
  await frame.locator('#plus').click();
  assert(await frame.locator('#zoomLabel').textContent() !== oldZoom);
  await frame.locator('#photoButton').click();
  assert(await frame.locator('#photoDialog').isVisible());
  await frame.locator('#closePhoto').click();
  await page.screenshot({ path: resolve(root, 'tmp/consulta.png') });
  assert(await page.locator('#password').inputValue() === '');
  assert(await page.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0));
  await page.locator('#lock').click();
  assert(await page.locator('#login').isVisible());
  assert(!await page.locator('#tree').getAttribute('src'));
  await page.setViewportSize({ width: 390, height: 844 });
  assert(!await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await page.screenshot({ path: resolve(root, 'tmp/acces-mobil.png') });
  const privateResponse = await page.request.get(url + 'local/llop/arbre-genealogic.html');
  assert(privateResponse.status() === 404);
  assert.deepEqual(errors, [], 'El navegador no ha de registrar errors ni infraccions CSP.');
  console.log('PASS: xifrat autenticat, contrasenya incorrecta, integritat, exclusions Git, absència de dades en clar, CSP, accés correcte, consulta sense edició, zoom, fotografia, tancament i mòbil.');
} finally { await browser.close(); server.close(); }
