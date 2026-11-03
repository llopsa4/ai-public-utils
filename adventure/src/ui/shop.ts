// Corvin's stall: Kiln Tonics for salvage.
import { t } from '../engine/i18n';
import { sound } from '../audio/sound';
import { TONIC } from '../content/kit';
import { buyTonic } from '../engine/kit';
import { $, type Ui } from './ui';

/** The merchant's stall: Kiln Tonics for salvage. Resolves when closed. */
export function openShop(ui: Ui): Promise<void> {
  const dialog = $<HTMLDialogElement>('shop');
  renderShop(ui, '');
  dialog.showModal();
  return new Promise(resolve => dialog.addEventListener('close', () => { ui.host.autosave(); resolve(); }, { once: true }));
}

export function renderShop(ui: Ui, note: string): void {
  const bag = ui.host.getState().bag;
  const body = $('shop-body');
  const item = document.createElement('p');
  item.textContent = t('ui.shopItem', { heal: String(TONIC.heal) });
  const buy = document.createElement('button');
  buy.type = 'button';
  buy.id = 'shop-buy';
  buy.className = 'btn primary';
  buy.textContent = t('ui.buyFor', { price: String(TONIC.price) });
  buy.disabled = bag.salvage < TONIC.price || bag.tonics >= TONIC.max;
  buy.addEventListener('click', () => {
    const result = buyTonic(bag);
    if (result === 'bought') sound.pickup();
    ui.host.autosave();
    renderShop(ui, result === 'bought' ? t('ui.shopBought') : result === 'full' ? t('ui.shopFull', { max: String(TONIC.max) }) : t('ui.shopPoor'));
    $('shop-buy').focus();
  });
  const have = document.createElement('p');
  have.textContent = t('ui.shopHave', { salvage: String(bag.salvage), tonics: String(bag.tonics), max: String(TONIC.max) });
  const status = document.createElement('p');
  status.className = 'shop-note';
  status.setAttribute('role', 'status');
  // What just happened, then why another can't be bought (if so).
  const limit = bag.tonics >= TONIC.max ? t('ui.shopFull', { max: String(TONIC.max) }) : bag.salvage < TONIC.price ? t('ui.shopPoor') : '';
  status.textContent = [note, limit].filter((s, i, all) => s && all.indexOf(s) === i).join(' ');
  body.replaceChildren(item, buy, have, status);
}
