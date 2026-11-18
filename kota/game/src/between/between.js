// Between waves (DESIGN-m1.md sections 5, 7 and 8): helper level-ups, then the shop "the makers' fire".
// Pure helpers (pickTier, priceFactor) are exported so a scripted test can check the numbers.

import { STAT_INFO, fmtDelta } from '../run/stats.js';

const ROMAN = ['I', 'II', 'III', 'IV'];
const TIER_CHANCE = { 2: 0.30, 3: 0.15, 4: 0.05 };
export const LEVEL_GATES = { 2: 5, 3: 10, 4: 15 };      // hero level at which a helper tier can appear
export const SHOP_GATES = { 2: 4, 3: 8, 4: 12 };        // wave at which a weapon tier can appear
const OFFERS = 4;
const WEAPON_SHARE = 0.35;

export const priceFactor = (wave) => 1 + 0.08 * (wave - 1);

/** Highest tier whose gate is open and whose luck-scaled chance hits, checked IV down to II; otherwise I. */
export function pickTier(progress, gates, luck, rand = Math.random) {
  for (const tier of [4, 3, 2]) {
    if (progress >= gates[tier] && rand() < TIER_CHANCE[tier] * (1 + luck / 100)) return tier;
  }
  return 1;
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const shuffle = (list) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export class Between {
  constructor(scene) {
    this.scene = scene;
    const json = (k) => scene.cache.json.get(k);
    this.itemList = json('items');
    this.itemDefs = Object.fromEntries(this.itemList.map((d) => [d.id, d]));
    this.helperList = json('helpers');
    this.values = json('helperValues');
    this.weaponList = json('weapons');
    this.weaponDefs = Object.fromEntries(this.weaponList.map((d) => [d.id, d]));
    this.offers = [];              // shop slots: an offer object, or null once bought
    this.rerolls = 0; this.sellArm = -1; this.note = ''; this.root = null; this.onDone = null;
  }

  get app() { return this.scene.app; }

  /** Run the level-up picks (one per pending level), then the shop, then call `onDone`. */
  start(onDone) {
    this.onDone = onDone;
    this.nextLevelUp();
  }

  /* ---------- level-ups: helpers ---------- */

  levelOffers() {
    const sc = this.scene, built = this.app.camp?.built ?? [];
    const pool = this.helperList.filter((h) => !h.requires || built.includes(h.requires));
    return shuffle(pool).slice(0, OFFERS).map((helper) => {
      const stat = pick(helper.stats);
      const tier = pickTier(sc.level, LEVEL_GATES, sc.stats.luck);
      return { helper, stat, tier, value: this.values[stat][tier - 1] };
    });
  }

  nextLevelUp() {
    const sc = this.scene;
    if (sc.pendingLevels <= 0) { this.startShop(); return; }
    sc.pendingLevels--;
    this.app.hints.trigger('levelup');
    const more = sc.pendingLevels;
    const options = this.levelOffers().map((o) => ({
      label: o.helper.name,
      detail: `${fmtDelta(o.stat, o.value)}${o.tier > 1 ? ` (${ROMAN[o.tier - 1]})` : ''}\n“${o.helper.line}”`,
      onClick: () => { sc.addStats({ [o.stat]: o.value }); this.nextLevelUp(); },
    }));
    this.app.ui.show('Level up!', more ? `Choose a helper (${more} more after this).` : 'Choose a helper.', options);
  }

  /* ---------- the shop ---------- */

  weaponPrice(id, tier, wave) {
    return Math.round(this.weaponDefs[id].price * this.scene.rules.tierPriceMul[tier - 1] * priceFactor(wave));
  }

  itemCount(id) { return this.scene.items[id] ?? 0; }
  itemAtMax(def) { return def.max != null && this.itemCount(def.id) >= def.max; }

  rollOffer() {
    const sc = this.scene, wave = sc.wave, mul = 1 + sc.stats.luck / 100;
    if (Math.random() < WEAPON_SHARE) {
      const def = pick(this.weaponList);
      const tier = pickTier(wave, SHOP_GATES, sc.stats.luck);
      return { kind: 'weapon', id: def.id, tier, price: this.weaponPrice(def.id, tier, wave), locked: false };
    }
    const uncommon = Math.max(0, Math.min(0.40, 0.04 * (wave - 2))) * mul;
    const rare = Math.max(0, Math.min(0.25, 0.02 * (wave - 5))) * mul;
    const r = Math.random();
    const rarity = r < rare ? 'rare' : r < rare + uncommon ? 'uncommon' : 'common';
    const open = this.itemList.filter((d) => !this.itemAtMax(d));
    const same = open.filter((d) => d.rarity === rarity);
    const def = pick(same.length ? same : open);
    return { kind: 'item', id: def.id, tier: 1, price: Math.round(def.price * priceFactor(wave)), locked: false };
  }

  startShop() {
    this.rerolls = 0; this.sellArm = -1; this.note = ''; this.root = null;
    for (let i = 0; i < OFFERS; i++) {
      if (!this.offers[i] || !this.offers[i].locked) this.offers[i] = this.rollOffer();
    }
    this.app.hints.trigger('shop');
    this.render();
  }

  rerollCost() { return Math.max(2, this.scene.wave + 1) + this.rerolls; }

  reroll() {
    const sc = this.scene, cost = this.rerollCost();
    if (sc.embers < cost) { this.note = `A reroll costs ${cost} embers.`; this.render(); return; }
    sc.embers -= cost; this.rerolls++; this.note = '';
    for (let i = 0; i < OFFERS; i++) if (!this.offers[i]?.locked) this.offers[i] = this.rollOffer();
    this.render();
  }

  toggleLock(i) {
    const o = this.offers[i];
    if (o) { o.locked = !o.locked; this.render(); }
  }

  /** Whether a weapon of this tier can be taken: a free slot, or an identical weapon to merge into. */
  canTake(id, tier) {
    const w = this.scene.weapons;
    return w.list.length < w.slots || w.list.some((x) => x.id === id && x.tier === tier && tier < 4);
  }

  buy(i) {
    const sc = this.scene, o = this.offers[i];
    if (!o) return;
    this.sellArm = -1; this.note = '';
    if (sc.embers < o.price) { this.note = `You need ${o.price} embers.`; this.render(); return; }
    if (o.kind === 'weapon') {
      if (!this.canTake(o.id, o.tier)) { this.note = 'All six slots are full: sell one, or buy a copy of a weapon you carry.'; this.render(); return; }
      sc.embers -= o.price;
      sc.weapons.add(o.id, o.tier);
    } else {
      const def = this.itemDefs[o.id];
      if (this.itemAtMax(def)) { this.note = `You already carry the most of ${def.name}.`; this.render(); return; }
      sc.embers -= o.price;
      sc.items[o.id] = this.itemCount(o.id) + 1;
      sc.addStats(def.stats);
      sc.refreshSpecials();
    }
    this.offers[i] = null;
    this.app.audio.pickup();
    this.render();
  }

  sellPrice(w) { return Math.floor(this.scene.rules.sellRate * this.weaponPrice(w.id, w.tier, this.scene.wave)); }

  sell(i) {
    const sc = this.scene, w = sc.weapons.list[i];
    if (!w) return;
    if (this.sellArm !== i) { this.sellArm = i; this.render(); return; }    // the first tap asks, the second sells
    const gain = this.sellPrice(w);
    sc.weapons.remove(i);
    sc.embers += gain;
    this.sellArm = -1; this.note = `Sold for ${gain} embers.`;
    this.render();
  }

  merge(i) {
    const sc = this.scene, pair = sc.weapons.pairs().find(([a, b]) => a === i || b === i);
    if (!pair) return;
    sc.weapons.merge(pair[0], pair[1]);
    this.sellArm = -1; this.note = 'Merged: one stronger weapon.';
    this.render();
  }

  nextWave() {
    this.app.ui.hide();
    this.root = null;
    const done = this.onDone; this.onDone = null;
    done?.();
  }

  /* ---------- the shop screen ---------- */

  describeItem(def) {
    const parts = Object.entries(def.stats).map(([k, v]) => fmtDelta(k, v));
    if (def.text) parts.push(def.text);
    if (def.max != null) parts.push(`Up to ${def.max}`);
    return parts.join('\n');
  }

  describeWeapon(id, tier) {
    const def = this.weaponDefs[id], t = def.tiers[tier - 1];
    return `${def.kind}, ${t.damage} damage\nevery ${t.cooldown}s, reach ${t.range}`;
  }

  button(cls, text, onClick, disabled) {
    const b = el('button', cls, text);
    b.type = 'button';
    if (disabled) b.disabled = true;
    b.addEventListener('click', onClick);
    return b;
  }

  offerCard(o, i) {
    const sc = this.scene;
    const card = el('div', `card ${o ? o.kind : 'empty'}${o?.locked ? ' locked' : ''}`);
    if (!o) { card.append(el('div', 'sold', 'Taken')); return card; }
    const def = o.kind === 'weapon' ? this.weaponDefs[o.id] : this.itemDefs[o.id];
    const sub = o.kind === 'weapon' ? `Weapon · tier ${ROMAN[o.tier - 1]}` : `Item · ${def.rarity}`;
    const text = o.kind === 'weapon' ? this.describeWeapon(o.id, o.tier) : this.describeItem(def);
    const row = el('div', 'row');
    row.append(this.button('buy', `Buy ${o.price}`, () => this.buy(i), sc.embers < o.price),
      this.button('lock', o.locked ? 'Locked' : 'Lock', () => this.toggleLock(i)));
    card.append(el('div', 'card-name', def.name), el('div', 'card-sub', sub), el('div', 'card-text', text), row);
    return card;
  }

  weaponCard(w, i) {
    const sc = this.scene, def = this.weaponDefs[w.id];
    const card = el('div', 'card mine');
    card.append(el('div', 'card-name', def.name), el('div', 'card-sub', `Tier ${ROMAN[w.tier - 1]}`));
    const row = el('div', 'row');
    if (sc.weapons.pairs().some(([a, b]) => a === i || b === i)) row.append(this.button('merge', 'Merge', () => this.merge(i)));
    const armed = this.sellArm === i;
    row.append(this.button(armed ? 'sell armed' : 'sell', armed ? `Sure? +${this.sellPrice(w)}` : `Sell ${this.sellPrice(w)}`, () => this.sell(i)));
    card.append(row);
    return card;
  }

  statsPanel() {
    const sc = this.scene, box = el('div', 'stats');
    box.append(el('div', 'stats-title', `Health ${Math.ceil(sc.stats.hp)} / ${sc.stats.maxHp}`));
    for (const [key, [name, unit]] of Object.entries(STAT_INFO)) {
      if (key === 'maxHp') continue;
      const v = Math.round(sc.stats[key] * 10) / 10;
      const row = el('div', `stat${v ? '' : ' zero'}`);
      row.append(el('span', null, name), el('span', null, `${v}${unit}`));
      box.append(row);
    }
    const items = Object.entries(sc.items).filter(([, n]) => n > 0);
    if (items.length) {
      box.append(el('div', 'stats-title', 'Carried'));
      box.append(el('div', 'carried', items.map(([id, n]) => `${this.itemDefs[id].name}${n > 1 ? ` ×${n}` : ''}`).join(', ')));
    }
    return box;
  }

  render() {
    const sc = this.scene, keep = this.root?.scrollTop ?? 0;
    const root = el('div', 'shop');
    const head = el('div', 'shop-head');
    head.append(el('h1', null, `The makers' fire · after wave ${sc.wave}`), el('div', 'embers', `Embers ${sc.embers}`),
      this.button('opt reroll', `Reroll ${this.rerollCost()}`, () => this.reroll()),
      this.button('opt next', `Next wave (${sc.wave + 1})`, () => this.nextWave()));
    const offers = el('div', 'offers');
    this.offers.forEach((o, i) => offers.append(this.offerCard(o, i)));
    const mine = el('div', 'mine-row');
    sc.weapons.list.forEach((w, i) => mine.append(this.weaponCard(w, i)));
    const left = el('div', 'shop-main');
    left.append(el('div', 'note', this.note), offers, el('div', 'card-sub', `Your weapons (${sc.weapons.list.length} / ${sc.weapons.slots})`), mine);
    root.append(head, left, this.statsPanel());
    this.root = root;
    this.app.ui.showPanel(root);
    root.scrollTop = keep;
  }
}
