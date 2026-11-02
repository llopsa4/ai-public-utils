import { ITEM_ICONS, PORTRAITS, PORTRAIT_MOODS, VERB_ICONS, type Mood } from '../game/assets';
import { LANGUAGES, language, onLanguageChange, setLanguage, t, type Language } from '../engine/i18n';
import { MAX_SAVE_BYTES, parseSave, saveFileName, serializeSave } from '../engine/saveFile';
import { TEXT_SCALE, lineDuration, onSettingsChange, settings, updateSettings, type Settings } from '../engine/settings';
import { objectives } from '../content/objectives';
import { readAutosave } from '../engine/autosave';
import { MET_FLAGS, SECRET_FLAGS } from '../engine/state';
import type { GameState, Point, Speaker, Verb } from '../engine/types';
import { EXTRAS } from '../content/crowd';
import { BattleUi, type BattleHandlers } from './battle';
import { sound } from '../audio/sound';
import { EQUIPMENT_SLOTS, openingHandSize } from '../combat/equipment';
import { EQUIPMENT } from '../combat/gear';
import type { BattleStats, EquipmentSlot } from '../combat/types';
import { HERO_MAX_HP, MATERIALS, TONIC } from '../content/combat';
import { buyTonic, equip, isLocked, optionsFor, statsWith } from '../engine/kit';

/** World size in logical units; all content coordinates use it. */
export const LOGICAL_W = 640;
export const LOGICAL_H = 360;
/** Art and canvas resolution relative to the world (art is drawn at 1280x720). */
export const ART_SCALE = 2;

/** Mouth flap timing: one open/closed swap per this many ms, for about this long per character. */
const FLAP_MS = 130;
const FLAP_PER_CHAR = 42;

const SPEECH_COLORS: Record<string, string> = {
  hero: '#ffc26b', oren: '#a8dcff', nell: '#c4f29a',
  ...Object.fromEntries(EXTRAS.map(e => [e.id, e.color])),
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export interface UiHost {
  getState(): GameState;
  isBusy(): boolean;
  selectedItem(): string | null;
  selectItem(item: string | null): void;
  /** An inventory item was clicked: the host opens its action ring. */
  itemClicked(item: string, index: number): void;
  replaceState(state: GameState): void;
  newGame(): GameState;
  /** Starts a new story after the opening (the first room fades in slowly). */
  startStory(): void;
  /** Saves soon (after gear changes and purchases). */
  autosave(): void;
  /** Labels for everything interactive in the room, in world coordinates. */
  hotspotLabels(): { text: string; x: number; y: number }[];
  /** Title screen: load the autosave and start playing. */
  continueGame(): void;
  /** Leave the room for the title screen (the game is autosaved first). */
  toTitle(): void;
  /** Keyboard play: move the focus ring to the next/previous thing in the room. False = past the end. */
  cycleFocus(direction: 1 | -1): boolean;
  /** Keyboard play: open the action ring on the focused thing. False = nothing focused. */
  activateFocus(): boolean;
}

/**
 * Everything drawn over the game canvas: the dialogue panel, the action ring, dialogue choices,
 * hover label, hotspot labels, toasts, the satchel bar, the menu and its dialogs. DOM text stays
 * sharp at any zoom.
 */
export class Ui {
  zoom = 1;
  private readonly stage = $('stage');
  private readonly overlay = $('overlay');
  private readonly hover = $('hover');
  private readonly dialogue = $('dialogue');
  private readonly labels = $('labels');
  private readonly history: { actor: Speaker; text: string }[] = [];
  /** How many hints were shown per notebook goal (0, 1 or 2), for this play session. */
  private readonly hintStage = new Map<string, number>();
  private revealTimer = 0;
  private readonly radial = $('radial');
  private readonly choices = $('choices');
  private readonly toastEl = $('toast');
  private readonly live = $('live');
  private readonly inventory = $('inventory');
  private readonly menuButton = $<HTMLButtonElement>('menu-btn');
  private readonly menu = $<HTMLDialogElement>('menu');
  private readonly fileInput = $<HTMLInputElement>('import-file');
  private skipSpeech: (() => void) | null = null;
  private toastTimer = 0;
  private closeRadialHandler: (() => void) | null = null;

  constructor(private readonly host: UiHost) {
    this.buildLanguageButtons();
    this.menuButton.addEventListener('click', () => this.menu.showModal());
    $('menu-close').addEventListener('click', () => this.menu.close());
    $('menu-help').addEventListener('click', () => $<HTMLDialogElement>('help').showModal());
    $('menu-export').addEventListener('click', () => this.exportSave());
    $('menu-import').addEventListener('click', () => this.fileInput.click());
    $('end-new').addEventListener('click', () => { this.hideEnd(); void this.newStory(); });
    $('menu-history').addEventListener('click', () => this.openHistory()); // stacks over the pause menu; Back returns to it
    $('menu-settings').addEventListener('click', () => this.openSettings());
    $('notebook-btn').addEventListener('click', () => this.openNotebook());
    $('gear-btn').addEventListener('click', () => void this.openGear());
    $('reveal-btn').addEventListener('click', () => this.revealFor(3000));
    this.bindFullscreen();
    this.bindLongPress();
    const mute = $('mute-btn');
    const showMute = (s: Settings) => mute.setAttribute('aria-pressed', String(s.muted));
    mute.addEventListener('click', () => updateSettings({ muted: !settings().muted }));
    onSettingsChange(showMute);
    showMute(settings());
    for (const d of document.querySelectorAll<HTMLDialogElement>('dialog')) {
      d.addEventListener('click', e => { if (e.target === d) d.close(); });
      d.querySelector('.dialog-close')?.addEventListener('click', () => d.close());
    }
    this.dialogue.addEventListener('pointerdown', () => this.skip());
    this.bindSettingsForm();
    $('menu-new').addEventListener('click', () => {
      void this.confirm(t('ui.confirmNew')).then(yes => { if (yes) { this.menu.close(); void this.newStory(); } });
    });
    $('menu-title').addEventListener('click', () => { this.menu.close(); this.host.toTitle(); });
    $('title-continue').addEventListener('click', () => this.host.continueGame());
    $('title-new').addEventListener('click', () => {
      const start = () => void this.newStory();
      if (readAutosave().kind !== 'ok') { start(); return; }
      void this.confirm(t('ui.confirmNewTitle')).then(yes => { if (yes) start(); });
    });
    $('title-import').addEventListener('click', () => this.fileInput.click());
    $('title-settings').addEventListener('click', () => this.openSettings());
    $('hint-btn').addEventListener('click', () => this.nextHint());
    this.fileInput.addEventListener('change', () => void this.importSave());
    this.menu.addEventListener('click', e => { if (e.target === this.menu) this.menu.close(); });
    window.addEventListener('keydown', e => {
      if (this.introActive || this.battle.open) return;
      // Keyboard play: with nothing else focused, Tab walks through the room before the bar buttons.
      const free = (document.activeElement === document.body || document.activeElement === null)
        && !this.anyDialogOpen() && !this.radialOpen && this.choices.hidden && $('title').hidden;
      if (free && e.key === 'Tab' && this.host.cycleFocus(e.shiftKey ? -1 : 1)) e.preventDefault();
      if (free && e.key === 'Enter' && this.host.activateFocus()) e.preventDefault();
      if (e.key === ' ' && !e.repeat && !this.anyDialogOpen() && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        this.showLabels();
      }
      if (e.key === 'Escape' && !this.menu.open) {
        if (this.closeRadialHandler) this.closeRadial();
        else if (this.host.selectedItem()) this.host.selectItem(null);
      }
    });
    window.addEventListener('keyup', e => { if (e.key === ' ') this.hideLabels(); });
    onLanguageChange(() => this.translate());
    this.translate();
  }

  // ------------------------------------------------------------ layout ---
  layout(): number {
    const bar = $('bar').offsetHeight;
    const w = window.innerWidth, h = window.innerHeight - bar;
    // Painted, palette-reduced art scales smoothly, so the stage simply fits the window.
    this.zoom = Math.max(0.25, Math.min(w / LOGICAL_W, h / LOGICAL_H));
    this.stage.style.width = `${LOGICAL_W * this.zoom}px`;
    this.stage.style.height = `${LOGICAL_H * this.zoom}px`;
    this.overlay.style.fontSize = `${Math.round(Math.max(13, 7.5 * this.zoom) * TEXT_SCALE[settings().textSize])}px`;
    return this.zoom;
  }

  private toScreen(p: Point): Point {
    return { x: p.x * this.zoom, y: p.y * this.zoom };
  }

  // ------------------------------------------------------------ speech ---
  /**
   * Shows a spoken line in the dialogue panel (portrait, name, text; Mara on the left, others on
   * the right) and resolves when its time is up or the player clicks. With auto-advance off, only
   * a click moves on.
   */
  say(actor: Speaker, text: string, _at: Point, mood: Mood = 'neutral'): Promise<void> {
    this.skipSpeech?.();
    const panel = this.dialogue;
    const stopFlap = this.showPortrait(actor === 'hero' ? 'mara' : actor, mood, text.length);
    const name = $('dialogue-name');
    name.textContent = t(`speaker.${actor}`);
    name.style.color = SPEECH_COLORS[actor];
    $('dialogue-line').textContent = text;
    panel.style.borderColor = SPEECH_COLORS[actor];
    panel.classList.toggle('right', actor !== 'hero');
    const s = settings();
    $('dialogue-more').hidden = s.autoAdvance;
    panel.hidden = false;
    this.live.textContent = `${t(`speaker.${actor}`)}: ${text}`;
    this.history.push({ actor, text });
    return new Promise(resolve => {
      const done = () => {
        window.clearTimeout(timer);
        stopFlap();
        if (this.skipSpeech === done) { this.skipSpeech = null; panel.hidden = true; }
        resolve();
      };
      const timer = s.autoAdvance ? window.setTimeout(done, lineDuration(text, s.textSpeed)) : 0;
      this.skipSpeech = done;
    });
  }

  /**
   * Shows the speaker's portrait strip at the mood's frame and flaps the mouth for a while
   * (not with reduced motion). Returns a function that stops the flapping.
   */
  private showPortrait(sheet: string, mood: Mood, chars: number): () => void {
    const el = $('dialogue-portrait');
    const url = PORTRAITS[sheet];
    el.hidden = !url;
    if (!url) return () => {};
    const moods = PORTRAIT_MOODS[sheet] ?? ['neutral'];
    const frames = moods.length * 2;
    const base = Math.max(0, moods.indexOf(mood)) * 2;
    const show = (open: boolean) => {
      el.style.backgroundPositionX = `${((base + (open ? 1 : 0)) / (frames - 1)) * 100}%`;
    };
    el.style.backgroundImage = `url("${url}")`;
    el.style.backgroundSize = `${frames * 100}% 100%`;
    show(false);
    if (settings().reducedMotion) return () => {};
    let open = false;
    const flap = window.setInterval(() => { open = !open; show(open); }, FLAP_MS);
    const stop = window.setTimeout(() => { window.clearInterval(flap); show(false); }, Math.max(500, chars * FLAP_PER_CHAR));
    return () => { window.clearInterval(flap); window.clearTimeout(stop); show(false); };
  }

  /** Forgets the dialogue history and hint stages (new, imported or continued game). */
  resetSession(): void {
    this.history.length = 0;
    this.hintStage.clear();
  }

  text(key: string): string {
    return t(key);
  }

  // ------------------------------------------------------------- title ---
  showTitle(canContinue: boolean): void {
    $('app').classList.add('on-title');
    $('title').hidden = false;
    const cont = $<HTMLButtonElement>('title-continue');
    cont.hidden = !canContinue;
    (canContinue ? cont : $<HTMLButtonElement>('title-new')).focus({ preventScroll: true });
    this.setHover('');
    this.hideLabels();
  }

  hideTitle(): void {
    $('app').classList.remove('on-title');
    $('title').hidden = true;
  }

  // ---------------------------------------------- notebook, history, settings ---
  private anyDialogOpen(): boolean {
    return [...document.querySelectorAll('dialog')].some(d => d.open);
  }

  private openNotebook(): void {
    const list = $('objectives');
    list.replaceChildren();
    for (const o of objectives(this.host.getState())) {
      const li = document.createElement('li');
      li.textContent = t(o.key) + (o.optional ? ` ${t('ui.optional')}` : '');
      li.classList.toggle('done', o.done);
      list.append(li);
    }
    const found = SECRET_FLAGS.filter(f => this.host.getState().flags[f]).length;
    const secrets = $('secrets');
    secrets.hidden = found === 0;
    secrets.textContent = t('ui.secrets', { found: String(found), total: String(SECRET_FLAGS.length) });
    const met = MET_FLAGS.filter(f => this.host.getState().flags[f]).length;
    $('met').hidden = met === 0;
    $('met').textContent = t('ui.met', { found: String(met), total: String(MET_FLAGS.length) });
    this.renderHint();
    $<HTMLDialogElement>('notebook').showModal();
  }

  /** The first unfinished required goal: the one hints are about. */
  private currentGoal(): string | null {
    return objectives(this.host.getState()).find(o => !o.done && !o.optional)?.key ?? null;
  }

  /** Hints come in two stages per goal: a nudge, then the plain answer. */
  private renderHint(): void {
    const goal = this.currentGoal();
    const button = $<HTMLButtonElement>('hint-btn');
    const text = $('hint-text');
    $('hint-box').hidden = !goal;
    if (!goal) return;
    const stage = this.hintStage.get(goal) ?? 0;
    text.textContent = stage > 0 ? t(`hint.${goal.slice(4)}.${stage}`) : '';
    text.hidden = stage === 0;
    button.hidden = stage >= 2;
    button.textContent = t(stage === 0 ? 'ui.hint' : 'ui.hintMore');
  }

  private nextHint(): void {
    const goal = this.currentGoal();
    if (!goal) return;
    this.hintStage.set(goal, Math.min(2, (this.hintStage.get(goal) ?? 0) + 1));
    this.renderHint();
    this.live.textContent = $('hint-text').textContent ?? '';
  }

  private openHistory(): void {
    const list = $('history-list');
    list.replaceChildren();
    if (this.history.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = t('ui.historyEmpty');
      list.append(li);
    }
    for (const line of this.history) {
      const li = document.createElement('li');
      const who = document.createElement('strong');
      who.textContent = `${t(`speaker.${line.actor}`)}: `;
      who.style.color = SPEECH_COLORS[line.actor];
      li.append(who, line.text);
      list.append(li);
    }
    const dialog = $<HTMLDialogElement>('history');
    dialog.showModal();
    list.lastElementChild?.scrollIntoView({ block: 'end' });
  }

  openSettings(): void {
    const form = $<HTMLFormElement>('settings-form');
    const s = settings();
    (form.elements.namedItem('textSpeed') as RadioNodeList).value = s.textSpeed;
    (form.elements.namedItem('textSize') as RadioNodeList).value = s.textSize;
    (form.elements.namedItem('visualQuality') as RadioNodeList).value = s.visualQuality;
    (form.elements.namedItem('volume') as HTMLInputElement).value = String(s.volume);
    (form.elements.namedItem('musicVolume') as HTMLInputElement).value = String(s.musicVolume);
    for (const k of ['muted', 'autoAdvance', 'reducedMotion', 'highContrast'] as const) (form.elements.namedItem(k) as HTMLInputElement).checked = s[k];
    this.paintSliders();
    $<HTMLDialogElement>('settings').showModal();
  }

  /** Ember fill up to each slider's knob (Chromium has no native progress part). */
  private paintSliders(): void {
    for (const r of document.querySelectorAll<HTMLInputElement>('#settings-form input[type="range"]')) {
      r.style.setProperty('--fill', `${Number(r.value) * 100}%`);
    }
  }

  private bindSettingsForm(): void {
    const form = $<HTMLFormElement>('settings-form');
    form.addEventListener('input', () => this.paintSliders());
    form.addEventListener('submit', e => e.preventDefault());
    form.addEventListener('input', () => {
      const el = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
      updateSettings({
        textSpeed: (form.elements.namedItem('textSpeed') as RadioNodeList).value as Settings['textSpeed'],
        volume: Number(el('volume').value),
        musicVolume: Number(el('musicVolume').value),
        muted: el('muted').checked,
        autoAdvance: el('autoAdvance').checked,
        reducedMotion: el('reducedMotion').checked,
        textSize: (form.elements.namedItem('textSize') as RadioNodeList).value as Settings['textSize'],
        visualQuality: (form.elements.namedItem('visualQuality') as RadioNodeList).value as Settings['visualQuality'],
        highContrast: el('highContrast').checked,
      });
    });
    const apply = (s: Settings) => {
      const root = document.documentElement.classList;
      root.toggle('reduce-motion', s.reducedMotion);
      root.toggle('high-contrast', s.highContrast);
      // The sample line uses the dialogue panel's size for the chosen text size.
      $('settings-sample').style.fontSize = `${Math.round(Math.max(13, 7.5 * this.zoom) * TEXT_SCALE[s.textSize])}px`;
    };
    onSettingsChange(apply);
    apply(settings());
  }

  // ------------------------------------------------------------- gear ---
  /** Mara's gear: a choice per slot with its stats, and what he carries. Resolves when closed. */
  openGear(): Promise<void> {
    const dialog = $<HTMLDialogElement>('gear');
    this.renderGear();
    dialog.showModal();
    return new Promise(resolve => dialog.addEventListener('close', () => { this.host.autosave(); resolve(); }, { once: true }));
  }

  private renderGear(preview?: { slot: EquipmentSlot; id: string }): void {
    const state = this.host.getState();
    const kit = state.kit;
    const describe = (id: string) => {
      const b = EQUIPMENT[id].bonuses;
      const parts = (Object.keys(b) as (keyof BattleStats)[]).filter(k => b[k]).map(k => `${b[k]! > 0 ? '+' : ''}${b[k]} ${t(`ui.stat.${k}`).toLowerCase()}`);
      return parts.length ? parts.join(', ') : t('ui.noBonus');
    };
    const slots = $('gear-slots');
    slots.replaceChildren();
    for (const slot of EQUIPMENT_SLOTS) {
      const row = document.createElement('div');
      row.className = 'gear-slot';
      const label = document.createElement('span');
      label.className = 'row-label';
      label.textContent = t(`ui.slot.${slot}`);
      row.append(label);
      const current = kit.equipment[slot].id;
      if (isLocked(slot)) {
        const p = document.createElement('p');
        p.className = 'gear-locked';
        p.textContent = `${EQUIPMENT[current].name}: ${t('ui.slotLocked')}`;
        row.append(p);
      } else {
        const group = document.createElement('div');
        group.className = 'segmented';
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', t(`ui.slot.${slot}`));
        for (const id of optionsFor(kit, slot)) {
          const l = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = `gear-${slot}`;
          input.value = id;
          input.checked = id === current;
          input.addEventListener('change', () => { if (equip(kit, slot, id)) { this.host.autosave(); this.renderGear(); } });
          const text = document.createElement('span');
          text.append(EQUIPMENT[id].name);
          const small = document.createElement('small');
          small.textContent = describe(id);
          text.append(small);
          l.append(input, text);
          l.addEventListener('pointerenter', () => this.renderGearStats(slot, id));
          l.addEventListener('pointerleave', () => this.renderGearStats());
          input.addEventListener('focus', () => this.renderGearStats(slot, id));
          group.append(l);
        }
        row.append(group);
      }
      slots.append(row);
    }
    this.renderGearStats(preview?.slot, preview?.id);
    const bag = state.bag;
    const mats = Object.entries(bag.materials).filter(([, n]) => n > 0).map(([id, n]) => `${n} ${t(MATERIALS[id].name)}`);
    const lines = [
      t('ui.health', { hp: String(kit.hp), max: String(HERO_MAX_HP) }),
      t('ui.salvage', { n: String(bag.salvage) }),
      t('ui.tonics', { n: String(bag.tonics) }),
      mats.length ? t('ui.materials', { list: mats.join(', ') }) : t('ui.noMaterials'),
    ];
    $('gear-bag').replaceChildren(...lines.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
  }

  /** The stats now, and (while hovering or focusing an option) what they would become. */
  private renderGearStats(slot?: EquipmentSlot, id?: string): void {
    const kit = this.host.getState().kit;
    const now = statsWith(kit);
    const then = slot && id ? statsWith(kit, slot, id) : now;
    const box = $('gear-stats');
    box.replaceChildren();
    for (const key of ['power', 'defense', 'speed', 'maxMp'] as const) {
      const name = document.createElement('span');
      name.textContent = t(`ui.stat.${key}`);
      const value = document.createElement('span');
      const diff = then[key] - now[key];
      value.className = `value${diff > 0 ? ' up' : diff < 0 ? ' down' : ''}`;
      value.textContent = diff ? `${now[key]} → ${then[key]}` : String(now[key]);
      const help = document.createElement('span');
      help.className = 'help';
      help.textContent = t(`ui.statHelp.${key}`);
      box.append(name, value, help);
    }
    const hand = document.createElement('span');
    hand.className = 'hand';
    hand.textContent = t('ui.openingHand', { n: String(openingHandSize(5, then.speed)) });
    box.append(hand);
  }

  // ------------------------------------------------------------- shop ---
  /** The merchant's stall: Kiln Tonics for salvage. Resolves when closed. */
  openShop(): Promise<void> {
    const dialog = $<HTMLDialogElement>('shop');
    this.renderShop('');
    dialog.showModal();
    return new Promise(resolve => dialog.addEventListener('close', () => { this.host.autosave(); resolve(); }, { once: true }));
  }

  private renderShop(note: string): void {
    const bag = this.host.getState().bag;
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
      this.host.autosave();
      this.renderShop(result === 'bought' ? t('ui.shopBought') : result === 'full' ? t('ui.shopFull', { max: String(TONIC.max) }) : t('ui.shopPoor'));
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

  /** True while the action ring is open. */
  ringOpen(): boolean {
    return this.radialOpen;
  }

  /** An in-game yes/no panel (the browser's confirm() looks like a form and blocks the page). */
  confirm(text: string): Promise<boolean> {
    const dialog = $<HTMLDialogElement>('confirm');
    $('confirm-text').textContent = text;
    return new Promise(resolve => {
      const yes = $('confirm-yes'), no = $('confirm-no');
      const done = (answer: boolean) => {
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
        dialog.removeEventListener('close', onClose);
        if (dialog.open) dialog.close();
        resolve(answer);
      };
      const onYes = () => done(true), onNo = () => done(false), onClose = () => done(false);
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
      dialog.addEventListener('close', onClose);
      dialog.showModal();
      no.focus();
    });
  }

  private introActive = false;
  /** The fight's controls (the battle scene sets the handlers). */
  readonly battle: BattleUi = new BattleUi($('overlay'), {
    play: id => this.battleHandlers?.play(id),
    endTurn: () => this.battleHandlers?.endTurn(),
    tonic: () => this.battleHandlers?.tonic(),
    skipGuide: () => this.battleHandlers?.skipGuide(),
  });
  battleHandlers: BattleHandlers | null = null;

  /**
   * A new story: the screen fades slowly to black, a few lines of context appear one after
   * another (click, Enter or Space for the next, Skip or Esc for all), then the game starts and
   * its first room fades in slowly.
   */
  private async newStory(): Promise<void> {
    if (this.introActive) return;
    this.introActive = true;
    this.setHover('');
    await this.playIntro();
    this.host.startStory();
    this.introActive = false;
    const intro = $('intro');
    // The black fades away over the room's own slow fade-in; play can start at once.
    intro.classList.add('leaving');
    window.setTimeout(() => {
      intro.style.setProperty('--intro-fade', '1.6s');
      intro.classList.remove('shown');
      window.setTimeout(() => { intro.hidden = true; intro.classList.remove('leaving'); }, settings().reducedMotion ? 0 : 1700);
    }, 50);
  }

  private playIntro(): Promise<void> {
    const intro = $('intro'), text = $('intro-text'), more = $('intro-more');
    const calm = settings().reducedMotion;
    const lines = [1, 2, 3, 4].map(n => t(`intro.${n}`));
    text.replaceChildren();
    text.classList.remove('out');
    more.classList.remove('in');
    intro.style.setProperty('--intro-fade', '1.8s');
    intro.hidden = false;
    void intro.offsetWidth; // start the fade from transparent
    intro.classList.add('shown');
    return new Promise(resolve => {
      let shown = 0, timer = 0, done = false;
      const wait = (ms: number, then: () => void) => { window.clearTimeout(timer); timer = window.setTimeout(then, calm ? Math.min(ms, 400) : ms); };
      const finish = () => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        intro.removeEventListener('click', onClick);
        window.removeEventListener('keydown', onKey, true);
        $('intro-skip').removeEventListener('click', onSkip);
        more.classList.remove('in');
        text.classList.add('out');
        window.setTimeout(resolve, calm ? 0 : 1300);
      };
      const next = () => {
        if (done) return;
        if (shown >= lines.length) { finish(); return; }
        for (const p of text.children) p.classList.add('past');
        const p = document.createElement('p');
        p.textContent = lines[shown++];
        text.append(p);
        void p.offsetWidth;
        p.classList.add('in');
        // Each line stays for its reading time unless the player moves on; the last one waits.
        if (shown === lines.length) wait(1500, () => more.classList.add('in'));
        else wait(Math.max(4200, lineDuration(p.textContent, settings().textSpeed) * 1.2), next);
      };
      const onClick = (e: Event) => { if (e.target !== $('intro-skip')) next(); };
      const onSkip = (e: Event) => { e.stopPropagation(); finish(); };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { e.preventDefault(); finish(); }
        else if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== $('intro-skip')) { e.preventDefault(); next(); }
      };
      intro.addEventListener('click', onClick);
      $('intro-skip').addEventListener('click', onSkip);
      window.addEventListener('keydown', onKey, true);
      $<HTMLButtonElement>('intro-skip').focus({ preventScroll: true });
      // The first line comes in once the screen is black.
      wait(1900, next);
    });
  }

  /** Says something to screen readers only (focus moves on the canvas). */
  announce(text: string): void {
    this.live.textContent = text;
  }

  // ------------------------------------------------------------ mobile ---
  /** Fullscreen toggle, only where the browser supports it (not on iPhone Safari). */
  private bindFullscreen(): void {
    const button = $<HTMLButtonElement>('fs-btn');
    if (!document.fullscreenEnabled) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    });
    document.addEventListener('fullscreenchange', () => button.setAttribute('aria-pressed', String(!!document.fullscreenElement)));
  }

  /** Touch: press and hold on the scene to label everything (the touch version of holding Space). */
  private bindLongPress(): void {
    let timer = 0, start: Point | null = null, shown = false;
    const cancel = () => { window.clearTimeout(timer); start = null; };
    this.stage.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch') return;
      start = { x: e.clientX, y: e.clientY };
      timer = window.setTimeout(() => { shown = true; this.showLabels(); }, 450);
    });
    this.stage.addEventListener('pointermove', e => {
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) cancel();
    });
    const release = () => {
      cancel();
      if (shown) { shown = false; this.revealFor(1500); }
    };
    this.stage.addEventListener('pointerup', release);
    this.stage.addEventListener('pointercancel', release);
  }

  // ------------------------------------------------------- hotspot labels ---
  private showLabels(): void {
    if (this.host.isBusy()) return;
    const box = this.labels;
    box.replaceChildren();
    for (const l of this.host.hotspotLabels()) {
      const el = document.createElement('span');
      el.className = 'label';
      el.textContent = l.text;
      const p = this.toScreen(l);
      el.style.left = `${p.x}px`;
      el.style.top = `${p.y}px`;
      box.append(el);
    }
    box.hidden = false;
    $('reveal-btn').setAttribute('aria-pressed', 'true');
  }

  private hideLabels(): void {
    window.clearTimeout(this.revealTimer);
    this.labels.hidden = true;
    $('reveal-btn').setAttribute('aria-pressed', 'false');
  }

  private revealFor(ms: number): void {
    this.showLabels();
    window.clearTimeout(this.revealTimer);
    this.revealTimer = window.setTimeout(() => this.hideLabels(), ms);
  }

  /** Ends the current line early. Returns whether there was one. */
  skip(): boolean {
    if (!this.skipSpeech) return false;
    this.skipSpeech();
    return true;
  }

  // ------------------------------------------------------- action ring ---
  get radialOpen(): boolean {
    return this.closeRadialHandler !== null;
  }

  openRadial(at: Point, name: string, verbs: Verb[], onPick: (verb: Verb) => void): void {
    this.closeRadial();
    const ring = this.radial;
    ring.replaceChildren();
    const backdrop = document.createElement('div');
    backdrop.className = 'radial-backdrop';
    backdrop.addEventListener('pointerdown', e => { e.preventDefault(); this.closeRadial(); });
    backdrop.addEventListener('contextmenu', e => e.preventDefault());
    ring.append(backdrop);

    const button = 44;
    const radius = Math.max(50, verbs.length * 11);
    const stageW = LOGICAL_W * this.zoom, stageH = LOGICAL_H * this.zoom;
    const margin = radius + button / 2 + 4;
    const p = this.toScreen(at);
    const cx = Math.min(Math.max(p.x, margin), stageW - margin);
    const cy = Math.min(Math.max(p.y, margin), stageH - margin);

    const label = document.createElement('div');
    label.className = 'radial-label';
    label.textContent = name;
    label.style.left = `${cx}px`;
    label.style.top = `${cy}px`;

    const buttons = verbs.map((verb, i) => {
      const angle = -Math.PI / 2 + (i / verbs.length) * Math.PI * 2;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'verb';
      b.dataset.verb = verb;
      const action = `${t(`verb.${verb}`)} ${name}`;
      b.setAttribute('aria-label', action);
      b.title = action;
      b.style.left = `${cx + Math.cos(angle) * radius}px`;
      b.style.top = `${cy + Math.sin(angle) * radius}px`;
      b.style.animationDelay = `${i * 18}ms`;
      const img = document.createElement('img');
      img.src = VERB_ICONS[verb];
      img.alt = '';
      b.append(img);
      const show = () => { label.textContent = action; };
      b.addEventListener('pointerenter', show);
      b.addEventListener('focus', show);
      b.addEventListener('pointerleave', () => { label.textContent = name; });
      b.addEventListener('click', () => { this.closeRadial(); onPick(verb); });
      b.addEventListener('keydown', e => {
        const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (step) { e.preventDefault(); buttons[(i + step + buttons.length) % buttons.length].focus(); }
      });
      return b;
    });
    ring.append(label, ...buttons);
    ring.hidden = false;
    this.closeRadialHandler = () => { ring.hidden = true; ring.replaceChildren(); };
    buttons[0]?.focus({ preventScroll: true });
  }

  closeRadial(): void {
    const close = this.closeRadialHandler;
    this.closeRadialHandler = null;
    close?.();
  }

  // ----------------------------------------------------------- choices ---
  choose(options: string[]): Promise<number> {
    const box = this.choices;
    box.replaceChildren();
    box.setAttribute('aria-label', t('ui.choices'));
    return new Promise(resolve => {
      const finish = (i: number) => {
        window.removeEventListener('keydown', onKey);
        box.hidden = true;
        box.replaceChildren();
        resolve(i);
      };
      const onKey = (e: KeyboardEvent) => {
        const n = Number(e.key);
        if (n >= 1 && n <= options.length) { e.preventDefault(); finish(n - 1); }
      };
      options.forEach((text, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        const n = document.createElement('span');
        n.className = 'choice-n';
        n.textContent = `${i + 1}`;
        n.setAttribute('aria-hidden', 'true');
        b.append(n, text);
        b.addEventListener('click', () => finish(i));
        box.append(b);
      });
      window.addEventListener('keydown', onKey);
      box.hidden = false;
      (box.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
    });
  }

  // ------------------------------------------------------ hover, toast ---
  /** The name under the pointer, shown beside it (or at the top centre without a position). */
  setHover(text: string, at?: Point): void {
    this.hover.textContent = text;
    this.hover.hidden = text === '';
    if (!text) return;
    if (!at) { this.hover.classList.remove('follow'); this.hover.style.left = ''; this.hover.style.top = ''; return; }
    const p = this.toScreen(at);
    this.hover.classList.add('follow');
    this.hover.classList.toggle('flip', p.x > LOGICAL_W * this.zoom * 0.75);
    this.hover.style.left = `${p.x}px`;
    this.hover.style.top = `${p.y}px`;
  }

  /**
   * A background person's speech bubble above a world point (chatter: not spoken to Mara, not in
   * the history, hidden from screen readers). Empty text hides it.
   */
  chatter(text: string, at?: Point): void {
    const el = $('chatter');
    if (!text || !at) { el.hidden = true; return; }
    if (el.textContent !== text) el.textContent = text;
    const p = this.toScreen(at);
    el.style.left = `${p.x}px`;
    el.style.top = `${p.y}px`;
    el.hidden = false;
  }

  toast(text: string, ms = 3500): void {
    this.toastEl.textContent = text;
    this.toastEl.hidden = false;
    this.live.textContent = text;
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => { this.toastEl.hidden = true; }, ms);
  }

  /** The closing card: shown over the stage until the player starts again. */
  showEnd(): void {
    const card = $('end');
    card.hidden = false;
    this.live.textContent = `${t('ui.endTag')}. ${t('ui.endText')}`;
    $<HTMLButtonElement>('end-new').focus({ preventScroll: true });
  }

  hideEnd(): void {
    $('end').hidden = true;
  }

  setBusy(busy: boolean): void {
    this.menuButton.disabled = busy;
    this.stage.classList.toggle('busy', busy);
  }

  // --------------------------------------------------------- inventory ---
  renderInventory(): void {
    const state = this.host.getState();
    $('gear-btn').hidden = !state.flags.fought;
    const selected = this.host.selectedItem();
    this.inventory.replaceChildren();
    if (state.inventory.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'empty';
      empty.textContent = t('ui.inventoryEmpty');
      this.inventory.append(empty);
    }
    for (const item of state.inventory) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'item';
      b.setAttribute('aria-pressed', String(selected === item));
      b.setAttribute('aria-label', t(`name.${item}`));
      b.title = t(`name.${item}`);
      const img = document.createElement('img');
      img.src = ITEM_ICONS[item];
      img.alt = '';
      b.append(img);
      const index = state.inventory.indexOf(item);
      b.addEventListener('click', () => {
        if (this.host.isBusy()) return;
        if (this.host.selectedItem() === item) this.host.selectItem(null);
        else this.host.itemClicked(item, index);
      });
      this.inventory.append(b);
    }
    const icon = selected ? ITEM_ICONS[selected] : null;
    this.stage.style.cursor = icon ? `url("${icon}") 16 16, pointer` : '';
  }

  // ---------------------------------------------------------- language ---
  private buildLanguageButtons(): void {
    const group = $('lang');
    group.hidden = LANGUAGES.length < 2;
    for (const lang of LANGUAGES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = lang.toUpperCase();
      b.dataset.lang = lang;
      b.addEventListener('click', () => setLanguage(lang as Language));
      group.append(b);
    }
  }

  private translate(): void {
    const lang = language();
    document.documentElement.lang = lang;
    document.title = t('ui.title');
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n!);
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel!));
    for (const b of document.querySelectorAll<HTMLButtonElement>('#lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    this.renderInventory();
  }

  // ------------------------------------------------------------- saves ---
  private exportSave(): void {
    if (this.host.isBusy()) return;
    const now = new Date();
    const blob = new Blob([serializeSave(this.host.getState(), now)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = saveFileName(now);
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast(t('ui.exported'));
  }

  private async importSave(): Promise<void> {
    const file = this.fileInput.files?.[0];
    this.fileInput.value = '';
    if (!file) return;
    const result = file.size > MAX_SAVE_BYTES ? { ok: false as const, error: 'save.error.tooLarge' } : parseSave(await file.text());
    if (!result.ok) { this.toast(t(result.error), 6000); return; }
    if (!$('app').classList.contains('on-title') && !(await this.confirm(t('ui.confirmImport')))) return;
    this.host.replaceState(result.state);
    this.menu.close();
    this.toast(t('ui.imported'));
  }
}
