// The gear screen (Kiln Courier's workshop) and Oren's forced first visit.
import { t } from '../engine/i18n';
import { EQUIPMENT } from '../combat/gear';
import { HERO_MAX_HP, LOCKED_SLOTS, MATERIALS, maraProfile } from '../content/kit';
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
 * Mara's gear on Kiln Courier's workshop screen (equip-only, src/kc/Armory.tsx), loaded on first
 * use. Resolves when Done is pressed.
 */
export async function openGear(ui: Ui): Promise<void> {
  const kc = await import('../kc/mount');
  const el = $('kc-root');
  el.hidden = false;
  await new Promise<void>(resolve => {
    const close = kc.mountArmory(el, {
      title: t('ui.gearTitle'), eyebrow: t('ui.gearEyebrow'), locked: [...LOCKED_SLOTS],
      read: () => {
        const { kit, bag } = ui.host.getState();
        const mats = Object.entries(bag.materials).filter(([, n]) => n > 0).map(([id, n]) => `${n} ${t(MATERIALS[id].name)}`);
        return {
          profile: maraProfile(kit), owned: [...kit.owned], salvage: bag.salvage,
          carried: [t('ui.health', { hp: String(kit.hp), max: String(HERO_MAX_HP) }), t('ui.tonics', { n: String(bag.tonics) }), mats.length ? t('ui.materials', { list: mats.join(', ') }) : t('ui.noMaterials')],
        };
      },
      onEquip: id => { equip(ui.host.getState().kit, EQUIPMENT[id].slot, id); ui.host.autosave(); },
      onClose: () => { close(); el.hidden = true; ui.host.autosave(); resolve(); },
    });
  });
}
