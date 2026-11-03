// Corvin's stall: Kiln Tonics for salvage.
import { t } from '../engine/i18n';
import { sound } from '../audio/sound';
import { TONIC } from '../content/kit';
import { buyTonic } from '../engine/kit';
import { TONIC_ICON } from './icons';
import { $, type Ui } from './ui';

/** The merchant's stall: Kiln Tonics for salvage. Resolves when closed. */
export function openShop(ui: Ui): Promise<void> {
  const dialog = $<HTMLDialogElement>('shop');
  renderShop(ui, '');
  dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => { ui.host.autosave(); resolve(); }, { once: true }));
}

type Effect = 'bought' | 'refused' | '';

/**
 * Corvin's counter: the salvage in Mara's purse, the Kiln Tonic on a glowing tile with how many he
 * carries, its price and Buy. Buying pulses the tile and floats a +1; a press when nothing can be
 * bought shakes it (the button says why).
 */
export function renderShop(ui: Ui, note: string, effect: Effect = ''): void {
  const bag = ui.host.getState().bag;
  const body = $('shop-body');
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = '') => {
    const e = document.createElement(tag);
    e.className = className;
    if (text) e.textContent = text;
    return e;
  };
  const full = bag.tonics >= TONIC.max, poor = bag.salvage < TONIC.price;

  const purse = el('p', 'stall-purse');
  purse.append(el('span', 'stall-coin', '◇'), el('strong', '', String(bag.salvage)), ` ${t('ui.shopPurse', { n: '' }).trim()}`);
  purse.setAttribute('aria-label', t('ui.shopPurse', { n: String(bag.salvage) }));

  const tile = el('div', `stall-tile${effect ? ` stall-${effect}` : ''}`);
  tile.innerHTML = TONIC_ICON;
  tile.append(el('span', 'stall-count', `${bag.tonics} / ${TONIC.max}`));
  if (effect === 'bought') tile.append(el('span', 'stall-float', '+1'));

  const info = el('div', 'stall-info');
  info.append(el('h2', 'stall-name', t('ui.shopTonic')), el('p', 'stall-effect', t('ui.shopEffect', { heal: String(TONIC.heal) })),
    el('p', 'stall-carry', t('ui.shopCarry', { n: String(bag.tonics), max: String(TONIC.max) })));
  const item = el('div', 'stall-item');
  item.append(tile, info);

  const price = el('span', 'stall-price');
  price.append(el('span', 'stall-coin', '◇'), String(TONIC.price));
  price.setAttribute('aria-label', t('ui.shopPrice', { price: String(TONIC.price) }));
  const buy = el('button', 'btn primary stall-buy', full ? t('ui.buyFull', { max: String(TONIC.max) }) : poor ? t('ui.buyPoor') : t('ui.buy'));
  buy.type = 'button';
  buy.id = 'shop-buy';
  buy.disabled = full || poor;
  buy.addEventListener('click', () => {
    const result = buyTonic(bag);
    if (result === 'bought') sound.pickup();
    ui.host.autosave();
    renderShop(ui, result === 'bought' ? t('ui.shopBought') : result === 'full' ? t('ui.shopFull', { max: String(TONIC.max) }) : t('ui.shopPoor'), result === 'bought' ? 'bought' : 'refused');
    $('shop-buy').focus();
  });
  const row = el('div', 'stall-row');
  row.append(price, buy);
  // A disabled button gets no clicks: a press on its row shakes the tile instead.
  row.addEventListener('pointerdown', () => { if (buy.disabled) renderShop(ui, note, 'refused'); });

  const status = el('p', 'shop-note');
  status.setAttribute('role', 'status');
  // What just happened, then why another can't be bought (if so).
  const limit = full ? t('ui.shopFull', { max: String(TONIC.max) }) : poor ? t('ui.shopPoor') : '';
  status.textContent = [note, limit].filter((x, i, all) => x && all.indexOf(x) === i).join(' ');
  body.replaceChildren(purse, item, row, status);
}
