import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync, createCipheriv, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const directory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ITERATIONS = 600_000;
export const AAD = 'family-tree-v1';

function replaceRange(source, start, end, replacement = '') {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  if (first < 0 || last < 0 || source.indexOf(start, first + 1) >= 0) {
    throw new Error(`El format de l'editor ha canviat. Cal revisar la conversió de consulta: ${start}`);
  }
  return source.slice(0, first) + replacement + source.slice(last);
}

export function readOnlyDocument(source) {
  if (!source.includes('id="tree-data"')) throw new Error('El document no conté un arbre amb zoom.');
  // El navegador normalitza els salts de línia abans de calcular el hash CSP.
  let result = source.replace(/\r\n?/g, '\n');
  result = result.replace('<span class="status" id="status" aria-live="polite"></span>', '');
  result = result.replace('<button class="primary" id="save">Desar còpia</button>', '');
  result = result.replaceAll('Clica una persona per editar', 'Clica una persona per consultar');
  result = result.replaceAll('Clica per editar', 'Clica per consultar');
  result = result.replaceAll('. Editar.', '. Consultar.');
  result = result.replace('aria-label="Editar persona"', 'aria-label="Consultar persona"');
  result = result.replace('<h2>Editar persona</h2>', '<h2>Fitxa familiar</h2>');
  result = replaceRange(result, '    <label for="personName">', '    <div id="relations"></div>',
    '    <h3 id="detailName"></h3><p id="detailDate"></p><p id="detailNote"></p>\n');
  result = result.replace(', dirty=false', '');
  result = replaceRange(result, '  function markDirty(){', '  function updateCamera(){');
  result = replaceRange(result, '    const p=people.get(id);selected=id;', '    const relations=',
    "    const p=people.get(id);selected=id;$('detailName').textContent=p.name;$('detailDate').textContent=p.date||'Sense data transcrita';$('detailNote').textContent=p.note;\n");
  result = result.replace(";$('cancelEdit').onclick=closeDrawer", '');
  result = replaceRange(result, "  $('applyEdit').onclick=()=>{", "  $('minus').onclick=");
  result = replaceRange(result, "  $('save').onclick=()=>{", '  const observer=');
  const forbidden = ['id="save"', 'applyEdit', 'personName', 'personDate', 'personNote',
    'cancelEdit', 'markDirty', 'contenteditable', 'Desar còpia', 'a.download', 'beforeunload'];
  if (forbidden.some(value => result.includes(value))) {
    throw new Error('La conversió encara conté controls o instruccions d’edició.');
  }
  return result;
}

export function encryptDocument(html, password) {
  if (!password) throw new Error('Cal una contrasenya no buida.');
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(AAD));
  const ciphertext = Buffer.concat([cipher.update(html, 'utf8'), cipher.final(), cipher.getAuthTag()]);
  key.fill(0);
  return { version: 1, kdf: 'PBKDF2-SHA256', iterations: ITERATIONS,
    cipher: 'AES-256-GCM', salt: salt.toString('base64'), iv: iv.toString('base64'),
    data: ciphertext.toString('base64') };
}

export function scriptHashes(html) {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => "'sha256-" + createHash('sha256').update(match[1]).digest('base64') + "'");
}

async function getPassword(fromStdin) {
  if (fromStdin) {
    let input = '';
    for await (const chunk of process.stdin) input += chunk;
    return input.replace(/\r?\n$/, '');
  }
  if (!process.stdin.isTTY) throw new Error('Utilitza --password-stdin quan no hi ha terminal interactiu.');
  process.stderr.write('Contrasenya de visualització (entrada oculta): ');
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  return new Promise((resolvePassword, reject) => {
    let password = '';
    const cleanup = () => { process.stdin.setRawMode(false); process.stdin.pause(); process.stdin.off('data', onData); process.stderr.write('\n'); };
    const onData = chunk => {
      for (const character of chunk) {
        if (character === '\u0003') { cleanup(); reject(new Error('Operació cancel·lada.')); return; }
        if (character === '\r' || character === '\n') { cleanup(); resolvePassword(password); return; }
        if (character === '\u007f' || character === '\b') password = password.slice(0, -1);
        else if (character >= ' ') password += character;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const sourceOption = args.indexOf('--source');
  if (sourceOption >= 0 && !args[sourceOption + 1]) throw new Error('Falta el camí de --source.');
  const sourcePath = sourceOption >= 0 ? resolve(args[sourceOption + 1]) : resolve(directory, 'local/llop/arbre-genealogic.html');
  const password = await getPassword(args.includes('--password-stdin'));
  const html = readOnlyDocument(await readFile(sourcePath, 'utf8'));
  const envelope = encryptDocument(html, password);
  const template = await readFile(resolve(directory, 'scripts/acces.template.html'), 'utf8');
  const index = template.replace('@@SCRIPT_HASHES@@', scriptHashes(html).join(' '));
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, 'dades.xifrades.json'), JSON.stringify(envelope), 'utf8');
  await writeFile(resolve(directory, 'index.html'), index, 'utf8');
  console.log('Versió de consulta xifrada preparada. Les dades locals no s’han publicat.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
