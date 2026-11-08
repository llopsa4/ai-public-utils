import { ITEM_ICONS, type Mood } from '../game/assets';
import { LANGUAGES, language, onLanguageChange, setLanguage, t, type Language } from '../engine/i18n';
import { TEXT_SCALE, onSettingsChange, settings, updateSettings, type Settings } from '../engine/settings';
import { readAutosave } from '../engine/autosave';
import type { GameState, Point, Speaker, Verb } from '../engine/types';
import { chapter } from '../chapters';
import { say } from './speech';
import { nextHint, openHistory, openNotebook } from './notebook';
import { initNotebookTabs } from './journal';
import { bindSettingsForm, openSettings } from './settingsMenu';
import { forceGear, openGear } from './gear';
import { openShop } from './shop';
import { chapterIntro, newStory } from './intro';
import { choose, closeRadial, openRadial } from './radial';
import { bindFullscreen, bindLongPress, hideLabels, revealFor, showLabels } from './labels';
import { exportSave, importSave } from './saves';
import { RoomControls } from './controls';
import { gearAvailable } from './shortcuts';

/** World size in logical units; all content coordinates use it. */
export const LOGICAL_W = 640;
export const LOGICAL_H = 360;
/** Art and canvas resolution relative to the world (art is drawn at 1280x720). */
export const ART_SCALE = 2;

/** Mouth flap timing: one open/closed swap per this many ms, for about this long per character. */
export const FLAP_MS = 130;
export const FLAP_PER_CHAR = 42;

export const SPEECH_COLORS: Record<string, string> = {
  hero: '#ffc26b', oren: '#a8dcff', nell: '#c4f29a', bryn: '#ff9f7a', tobi: '#f5d589',
  ...Object.fromEntries(chapter().extras.map(e => [e.id, e.color])),
};

export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export interface UiHost {
  getState(): GameState;
  isBusy(): boolean;
  selectedItem(): string | null;
  selectItem(item: string | null): void;
  /** An inventory item was clicked: the host opens its action ring. */
  itemClicked(item: string, index: number): void;
  useItemOnInventory(item: string, target: string): void;
  useItemAt(item: string, client: Point): void;
  moveDirection(direction: Point): void;
  replaceState(state: GameState): void;
  newGame(): GameState;
  /** Starts a new story after the opening (the first room fades in slowly). */
  startStory(): void;
  /** Saves soon (after gear changes and purchases). */
  autosave(): void;
  /** Equipment appearance changed; preserve the active actor's position and pose. */
  refreshHeroAppearance?(): void;
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
  readonly controls: RoomControls;
  zoom = 1;
  readonly stage = $('stage');
  readonly overlay = $('overlay');
  readonly hover = $('hover');
  readonly dialogue = $('dialogue');
  readonly labels = $('labels');
  readonly history: { actor: Speaker; text: string }[] = [];
  /** How many hints were shown per notebook goal (0, 1 or 2), for this play session. */
  readonly hintStage = new Map<string, number>();
  revealTimer = 0;
  readonly radial = $('radial');
  readonly choices = $('choices');
  readonly toastEl = $('toast');
  readonly live = $('live');
  readonly inventory = $('inventory');
  readonly menuButton = $<HTMLButtonElement>('menu-btn');
  readonly menu = $<HTMLDialogElement>('menu');
  readonly fileInput = $<HTMLInputElement>('import-file');
  skipSpeech: (() => void) | null = null;
  toastTimer = 0;
  closeRadialHandler: (() => void) | null = null;
  /** A lazy gear-screen import is in progress; this is transient UI state, never saved. */
  gearPending = false;

  constructor(readonly host: UiHost) {
    this.controls = new RoomControls(this);
    this.buildLanguageButtons();
    this.menuButton.addEventListener('click', () => this.openMenu());
    $('menu-close').addEventListener('click', () => this.menu.close());
    $('menu-help').addEventListener('click', () => $<HTMLDialogElement>('help').showModal());
    $('menu-export').addEventListener('click', () => exportSave(this));
    $('menu-import').addEventListener('click', () => this.fileInput.click());
    $('end-new').addEventListener('click', () => { this.hideEnd(); void newStory(this); });
    $('menu-history').addEventListener('click', () => openHistory(this)); // stacks over the pause menu; Back returns to it
    $('menu-settings').addEventListener('click', () => openSettings());
    $('notebook-btn').addEventListener('click', () => {
      if (this.gearPending) return;
      this.controls.cancel();
      openNotebook(this);
    });
    $('gear-btn').addEventListener('click', () => {
      if (!this.forcingGear && gearAvailable(this.host.getState())) void openGear(this);
    });
    $('reveal-btn').addEventListener('click', () => revealFor(this, 3000));
    bindFullscreen();
    bindLongPress(this);
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
    bindSettingsForm(this);
    $('menu-new').addEventListener('click', () => {
      void this.confirm(t('ui.confirmNew')).then(yes => { if (yes) { this.menu.close(); void newStory(this); } });
    });
    $('menu-title').addEventListener('click', () => { this.menu.close(); this.host.toTitle(); });
    $('title-continue').addEventListener('click', () => this.host.continueGame());
    $('title-new').addEventListener('click', () => {
      const start = () => void newStory(this);
      if (readAutosave().kind !== 'ok') { start(); return; }
      void this.confirm(t('ui.confirmNewTitle')).then(yes => { if (yes) start(); });
    });
    $('title-import').addEventListener('click', () => this.fileInput.click());
    // Save game on the title: the game saved in this browser, as a file.
    $('title-save').addEventListener('click', () => {
      const saved = readAutosave();
      if (saved.kind === 'ok') exportSave(this, saved.state);
    });
    $('title-settings').addEventListener('click', () => openSettings());
    $('hint-btn').addEventListener('click', () => nextHint(this));
    initNotebookTabs();
    this.fileInput.addEventListener('change', () => void importSave(this));
    this.menu.addEventListener('click', e => { if (e.target === this.menu) this.menu.close(); });
    window.addEventListener('keydown', e => {
      if (this.controls.keyDown(e)) return;
      if (this.gearPending) { e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (this.introActive || !$('kc-root').hidden) return;
      // Keyboard play: with nothing else focused, Tab walks through the room before the bar buttons.
      const free = (document.activeElement === document.body || document.activeElement === null)
        && !this.anyDialogOpen() && !this.radialOpen && this.choices.hidden && $('title').hidden;
      if (free && e.key === 'Tab' && this.host.cycleFocus(e.shiftKey ? -1 : 1)) e.preventDefault();
      if (free && e.key === 'Enter' && this.host.activateFocus()) e.preventDefault();
      if (e.key === ' ' && !e.repeat && !this.anyDialogOpen() && !(e.target instanceof HTMLInputElement)
        && !(e.target instanceof Element && e.target.closest('#inventory button'))) {
        e.preventDefault();
        showLabels(this);
      }
      if (e.key === 'Escape' && !this.menu.open) {
        if (this.closeRadialHandler) closeRadial(this);
        else if (this.host.selectedItem()) this.host.selectItem(null);
      }
    });
    window.addEventListener('keyup', e => { if (e.key === ' ') hideLabels(this); });
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

  toScreen(p: Point): Point {
    return { x: p.x * this.zoom, y: p.y * this.zoom };
  }

  // ------------------------------------------------------------ speech ---
  /**
   * Shows a spoken line in the dialogue panel (portrait, name, text; Mara on the left, others on
   * the right) and resolves when its time is up or the player clicks. With auto-advance off, only
   * a click moves on.
   */
  say(actor: Speaker, text: string, _at: Point, mood: Mood = 'neutral'): Promise<void> {
    return say(this, actor, text, _at, mood);
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
    $('title-save').hidden = !canContinue;
    (canContinue ? cont : $<HTMLButtonElement>('title-new')).focus({ preventScroll: true });
    this.setHover('');
    hideLabels(this);
  }

  hideTitle(): void {
    $('app').classList.remove('on-title');
    $('title').hidden = true;
  }

  // ---------------------------------------------- notebook, history, settings ---
  anyDialogOpen(): boolean {
    return [...document.querySelectorAll('dialog')].some(d => d.open);
  }






  openSettings(): void {
    return openSettings();
  }



  // ------------------------------------------------------------- gear ---
  forcingGear = false;

  /**
   * Oren's advice: the Gear button appears and is the only thing that can be used (the screen is
   * dimmed around it, other keys and clicks do nothing) until it is pressed; then the gear screen
   * opens. Resolves when it is closed.
   */
  forceGear(): Promise<void> {
    return forceGear(this);
  }

  /**
   * Mara's gear on Kiln Courier's workshop screen (equip-only, src/kc/Armory.tsx), loaded on first
   * use. Resolves when Done is pressed.
   */
  openGear(): Promise<void> {
    return openGear(this);
  }

  // ------------------------------------------------------------- shop ---
  /** The merchant's stall: Kiln Tonics for salvage. Resolves when closed. */
  openShop(): Promise<void> {
    return openShop(this);
  }


  /** Opens the pause menu (also from Kiln Courier's battle screen). */
  openMenu(): void {
    if (this.gearPending) return;
    this.controls.cancel();
    if (!this.menu.open) this.menu.showModal();
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

  introActive = false;

  /** A later chapter's opening lines over black (see `Chapter.intro`). */
  chapterIntro(keys: readonly string[], day?: string): Promise<void> {
    return chapterIntro(this, keys, day);
  }




  /** Says something to screen readers only (focus moves on the canvas). */
  announce(text: string): void {
    this.live.textContent = text;
  }

  // ------------------------------------------------------------ mobile ---


  // ------------------------------------------------------- hotspot labels ---



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
    return openRadial(this, at, name, verbs, onPick);
  }

  closeRadial(): void {
    return closeRadial(this);
  }

  // ----------------------------------------------------------- choices ---
  choose(options: string[]): Promise<number> {
    return choose(this, options);
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
    // The chapter's own end card (later chapters), else the game's.
    const end = chapter().end ?? { title: 'ui.endTitle', text: 'ui.endText' };
    const title = $('end-title'), text = card.querySelector<HTMLElement>('.end-text')!;
    title.dataset.i18n = end.title;
    text.dataset.i18n = end.text;
    title.textContent = t(end.title);
    text.textContent = t(end.text);
    this.live.textContent = `${t('ui.endTag')}. ${t(end.text)}`;
    $<HTMLButtonElement>('end-new').focus({ preventScroll: true });
  }

  hideEnd(): void {
    $('end').hidden = true;
  }

  setBusy(busy: boolean): void {
    if (busy) this.controls.cancel();
    this.syncScreenButtons();
    this.stage.classList.toggle('busy', busy);
  }

  /** Keep button availability aligned with the shortcut policy while gear loads or unlocks. */
  syncScreenButtons(): void {
    this.menuButton.disabled = this.host.isBusy() || this.gearPending;
    $<HTMLButtonElement>('notebook-btn').disabled = this.gearPending;
    const gear = $<HTMLButtonElement>('gear-btn');
    gear.hidden = !this.forcingGear && !gearAvailable(this.host.getState());
    gear.disabled = this.gearPending;
  }

  // --------------------------------------------------------- inventory ---
  renderInventory(): void {
    const state = this.host.getState();
    this.syncScreenButtons();
    const selected = this.host.selectedItem();
    this.inventory.replaceChildren();
    if (state.inventory.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'empty';
      empty.textContent = t('ui.inventoryEmpty');
      this.inventory.append(empty);
    }
    for (const [index, item] of state.inventory.entries()) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'item';
      b.dataset.item = item;
      b.setAttribute('aria-pressed', String(selected === item));
      b.setAttribute('aria-label', t(`name.${item}`));
      b.title = t(`name.${item}`);
      const img = document.createElement('img');
      img.src = ITEM_ICONS[item];
      img.alt = '';
      b.append(img);
      if (index < 10) {
        const key = index === 9 ? '0' : String(index + 1);
        const label = document.createElement('span');
        label.className = 'item-key'; label.textContent = key; label.setAttribute('aria-hidden', 'true');
        b.append(label); b.setAttribute('aria-keyshortcuts', key);
        b.title += ` (${key})`;
      }
      this.inventory.append(b);
    }
    this.controls.refreshItem();
  }

  // ---------------------------------------------------------- language ---
  buildLanguageButtons(): void {
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

  translate(): void {
    const lang = language();
    document.documentElement.lang = lang;
    document.title = t('ui.title');
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n]')) el.textContent = t(el.dataset.i18n!);
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel!));
    for (const el of document.querySelectorAll<HTMLElement>('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle!);
    for (const b of document.querySelectorAll<HTMLButtonElement>('#lang button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    this.renderInventory();
  }

  // ------------------------------------------------------------- saves ---

}
