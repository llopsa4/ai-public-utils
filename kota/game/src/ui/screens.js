// HUD and overlay screens (camp, level-up, shop, end). DOM based; uses textContent only.

export function createUI() {
  const $ = (id) => document.getElementById(id);
  const overlay = $('screen'), title = $('screen-title'), body = $('screen-body'), actions = $('screen-actions');
  const hpFill = $('hp-fill'), hpText = $('hp-text'), waveLabel = $('wave-label');
  const expFill = $('exp-fill'), expText = $('exp-text'), embersLabel = $('embers');
  const panel = $('screen-panel');
  const buttons = {};
  for (const el of document.querySelectorAll('.btn')) buttons[el.dataset.act] = el;

  let last = null, visible = false;    // so a menu opened on top can restore the screen beneath

  /** Show a ready-made element (the shop) instead of a heading and option buttons. */
  function showPanel(element) {
    last = { panel: element }; visible = true;
    for (const e of [title, body, actions]) e.style.display = 'none';
    panel.replaceChildren(element);
    panel.style.display = 'flex';
    overlay.style.display = 'flex';
  }

  function show(heading, text, options) {
    last = { heading, text, options }; visible = true;
    panel.style.display = 'none';
    for (const e of [title, body, actions]) e.style.display = '';
    title.textContent = heading;
    body.textContent = text;
    actions.replaceChildren(...options.map((o) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      const name = document.createElement('strong');
      name.textContent = o.label;
      b.append(name);
      if (o.detail) {
        const d = document.createElement('span');
        d.textContent = o.detail;
        b.append(d);
      }
      b.addEventListener('click', o.onClick);
      return b;
    }));
    overlay.style.display = 'flex';
  }

  return {
    show,
    showPanel,
    hide() { overlay.style.display = 'none'; visible = false; },
    snapshot() { return { last, visible }; },
    restore(snap) {
      if (snap.visible && snap.last?.panel) showPanel(snap.last.panel);
      else if (snap.visible && snap.last) show(snap.last.heading, snap.last.text, snap.last.options);
      else { overlay.style.display = 'none'; visible = false; last = snap.last; }
    },
    /** Show the in-run HUD (health, wave, buttons) or hide it (camp). */
    showHud(on) { document.body.classList.toggle('in-run', !!on); },
    setHp(hp, max) {
      hpFill.style.width = `${Math.max(0, hp / max) * 100}%`;
      hpText.textContent = `${Math.ceil(hp)}`;
    },
    setWave(text) { waveLabel.textContent = text; },
    /** Experience bar fill (0..1) and the hero's level. */
    setExp(frac, level) {
      expFill.style.width = `${Math.min(1, Math.max(0, frac)) * 100}%`;
      expText.textContent = `Lv ${level}`;
    },
    setEmbers(n) { embersLabel.textContent = `Embers ${n}`; },
    /** Cooldown fractions 0..1 (1 = just used) dim the buttons. */
    setCooldowns({ dash, ability }) {
      buttons.dash.style.opacity = String(1 - 0.6 * dash);
      buttons.ability.style.opacity = String(1 - 0.6 * ability);
    },
    /** Label under the ability button (the hero's ability name). */
    setAbilityLabel(text) { buttons.ability.textContent = text; },
  };
}
