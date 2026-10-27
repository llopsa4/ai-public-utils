(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let documentUrl = null;
  const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
  function closeTree() {
    $('tree').removeAttribute('src');
    if (documentUrl) URL.revokeObjectURL(documentUrl);
    documentUrl = null;
    $('viewer').hidden = true;
    $('login').hidden = false;
    $('password').value = '';
    $('password').type = 'password';
    $('toggle').textContent = 'Mostrar';
    $('toggle').setAttribute('aria-pressed', 'false');
    $('message').textContent = '';
    document.title = 'Arbre familiar · Accés protegit';
    $('password').focus();
  }
  $('toggle').addEventListener('click', () => {
    const show = $('password').type === 'password';
    $('password').type = show ? 'text' : 'password';
    $('toggle').textContent = show ? 'Amagar' : 'Mostrar';
    $('toggle').setAttribute('aria-pressed', String(show));
  });
  $('unlock').addEventListener('submit', async event => {
    event.preventDefault();
    if ($('submit').disabled) return;
    if (!window.crypto?.subtle) {
      $('message').textContent = 'Obre aquesta pàgina amb HTTPS en un navegador actualitzat.';
      return;
    }
    const password = $('password').value;
    $('password').value = '';
    $('submit').disabled = true;
    $('message').textContent = 'Obrint l’arbre…';
    try {
      const response = await fetch('./dades.xifrades.json', { cache: 'no-store', credentials: 'omit' });
      if (!response.ok) throw new Error('network');
      const payload = await response.json();
      if (payload.version !== 1 || payload.kdf !== 'PBKDF2-SHA256' || payload.cipher !== 'AES-256-GCM' || payload.iterations !== 600000) throw new Error('format');
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
      const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: decode(payload.salt), iterations: payload.iterations, hash: 'SHA-256' }, material,
        { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(payload.iv), additionalData: new TextEncoder().encode('family-tree-v1'), tagLength: 128 }, key, decode(payload.data));
      documentUrl = URL.createObjectURL(new Blob([plaintext], { type: 'text/html;charset=utf-8' }));
      $('tree').src = documentUrl;
      $('viewer').hidden = false;
      $('login').hidden = true;
      $('message').textContent = '';
      document.title = 'Arbre familiar · Consulta';
      $('lock').focus();
    } catch (error) {
      $('message').textContent = error.name === 'OperationError'
        ? 'Contrasenya incorrecta. Torna-ho a provar.'
        : 'No s’ha pogut obrir l’arbre. Comprova la connexió i torna-ho a provar.';
      $('password').focus();
    } finally {
      $('submit').disabled = false;
    }
  });
  $('lock').addEventListener('click', closeTree);
  window.addEventListener('pagehide', () => { if (documentUrl) URL.revokeObjectURL(documentUrl); });
  window.addEventListener('pageshow', event => { if (event.persisted) closeTree(); });
})();
