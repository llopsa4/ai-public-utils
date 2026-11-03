// The gear screen (Kiln Courier's workshop) and Oren's forced first visit.
import { t } from '../engine/i18n';
import { EQUIPMENT } from '../combat/gear';
import { ALL_GEAR } from '../content/kit';
import { LOCKED_SLOTS, maraProfile } from '../content/kit';
import { equip } from '../engine/kit';
import { $, type Ui } from './ui';

/**
 * Oren's advice: the Gear button appears and is the only thing that can be used (the screen is
 * dimmed around it, other keys and clicks do nothing) until it is pressed; then the gear screen
 * opens. Resolves when it is closed.
 */
export async function forceGear(ui: Ui): Promise<void> {
  const button = $<HTMLButtonElement>('gear-btn');
  button.hidden = false;
  button.disabled = false;
  button.dataset.call = t('ui.gearCall');
  button.classList.add('forced');
  const veil = document.createElement('div');
  veil.id = 'force-veil';
  document.body.append(veil);
  ui.forcingGear = true;
  const keys = (e: KeyboardEvent) => {
    if (document.activeElement === button && (e.key === 'Enter' || e.key === ' ' || e.key === 'Tab')) { if (e.key === 'Tab') { e.preventDefault(); } return; }
    e.preventDefault();
    e.stopImmediatePropagation();
    button.focus({ preventScroll: true });
  };
  window.addEventListener('keydown', keys, true);
  button.focus({ preventScroll: true });
  await new Promise<void>(resolve => button.addEventListener('click', () => resolve(), { once: true }));
  window.removeEventListener('keydown', keys, true);
  ui.forcingGear = false;
  button.classList.remove('forced');
  veil.remove();
  await openGear(ui);
}

/**
 * Mara's gear: Kiln Courier's workshop (equip-only, src/kc/Armory.tsx, loaded on first use) in a
 * pop-up over the room, like the shop. Resolves when it is closed (Done, Escape or a click outside).
 */
export async function openGear(ui: Ui): Promise<void> {
  const kc = await import('../kc/mount');
  const dialog = $<HTMLDialogElement>('gear');
  // ?debug: every equipable piece in the game is in the stash and nothing is locked; equipping one
  // adds it to Mara's gear (saves accept any piece, so this survives a reload).
  const debug = new URLSearchParams(location.search).has('debug');
  await new Promise<void>(resolve => {
    const unmount = kc.mountArmory($('gear-body'), {
      popup: true, title: t('ui.gearTitle'), eyebrow: t('ui.gearEyebrow'), locked: debug ? [] : [...LOCKED_SLOTS],
      // The paper doll shows only the gear and the stats it gives (no purse or bag).
      read: () => {
        const { kit, bag } = ui.host.getState();
        return { profile: maraProfile(kit), owned: debug ? [...new Set([...kit.owned, ...ALL_GEAR])] : [...kit.owned], salvage: bag.salvage, carried: [], tonics: bag.tonics };
      },
      onEquip: id => {
        const kit = ui.host.getState().kit;
        if (debug && !kit.owned.includes(id)) kit.owned.push(id);
        equip(kit, EQUIPMENT[id].slot, id, debug);
        ui.host.autosave();
      },
      onClose: () => dialog.close(),
    });
    dialog.addEventListener('close', () => { unmount(); ui.host.autosave(); resolve(); }, { once: true });
    dialog.showModal();
  });
}
