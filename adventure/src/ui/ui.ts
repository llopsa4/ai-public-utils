import { ITEM_ICONS, PORTRAITS, VERB_ICONS } from '../game/assets';
import { LANGUAGES, language, onLanguageChange, setLanguage, t, type Language } from '../engine/i18n';
import { MAX_SAVE_BYTES, parseSave, saveFileName, serializeSave } from '../engine/saveFile';
import type { ActorId, GameState, Point, Verb } from '../engine/types';

/** World size in logical units; all content coordinates use it. */
export const LOGICAL_W = 640;
export const LOGICAL_H = 360;
/** Art and canvas resolution relative to the world (art is drawn at 1280x720). */
export const ART_SCALE = 2;

const SPEECH_COLORS: Record<ActorId, string> = { hero: '#ffc26b', oren: '#a8dcff', nell: '#c4f29a' };

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
}

/**
 * Everything drawn over the game canvas: speech, the action ring, dialogue choices, hover label,
 * toasts, the inventory bar and the menu. DOM text stays sharp at any zoom and supports accents
 * in all three languages without a bitmap font.
 */
export class Ui {
  zoom = 1;
  private readonly stage = $('stage');
  private readonly overlay = $('overlay');
  private readonly hover = $('hover');
  private readonly speech = $('speech');
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
    $('menu-export').addEventListener('click', () => this.exportSave());
    $('menu-import').addEventListener('click', () => this.fileInput.click());
    $('end-new').addEventListener('click', () => { this.hideEnd(); this.host.replaceState(this.host.newGame()); });
    $('menu-new').addEventListener('click', () => {
      if (window.confirm(t('ui.confirmNew'))) { this.host.replaceState(this.host.newGame()); this.menu.close(); }
    });
    this.fileInput.addEventListener('change', () => void this.importSave());
    this.menu.addEventListener('click', e => { if (e.target === this.menu) this.menu.close(); });
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !this.menu.open) {
        if (this.closeRadialHandler) this.closeRadial();
        else if (this.host.selectedItem()) this.host.selectItem(null);
      }
    });
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
    this.overlay.style.fontSize = `${Math.max(13, Math.round(7.5 * this.zoom))}px`;
    return this.zoom;
  }

  private toScreen(p: Point): Point {
    return { x: p.x * this.zoom, y: p.y * this.zoom };
  }

  // ------------------------------------------------------------ speech ---
  /** Shows a spoken line above a point; resolves when its time is up or the player skips it. */
  say(actor: ActorId, text: string, at: Point): Promise<void> {
    this.skipSpeech?.();
    const el = this.speech;
    el.textContent = text;
    el.style.color = SPEECH_COLORS[actor];
    el.hidden = false;
    this.showPortrait(actor, at);
    const p = this.toScreen(at);
    const width = el.offsetWidth, height = el.offsetHeight;
    const stageW = LOGICAL_W * this.zoom;
    el.style.left = `${Math.min(Math.max(p.x - width / 2, 4), stageW - width - 4)}px`;
    el.style.top = `${Math.max(p.y - height, 4)}px`;
    this.live.textContent = text;
    const duration = Math.min(6000, Math.max(1500, 900 + text.length * 55));
    return new Promise(resolve => {
      const done = () => {
        window.clearTimeout(timer);
        if (this.skipSpeech === done) { this.skipSpeech = null; el.hidden = true; $('portrait').hidden = true; }
        resolve();
      };
      const timer = window.setTimeout(done, duration);
      this.skipSpeech = done;
    });
  }

  /** Large Kiln Courier portrait of whoever is speaking, with their name, opposite the speaker. */
  private showPortrait(actor: ActorId, at: Point): void {
    const box = $('portrait');
    const url = PORTRAITS[actor === 'hero' ? 'mara' : actor];
    if (!url) { box.hidden = true; return; }
    box.querySelector('img')!.src = url;
    box.querySelector('figcaption')!.textContent = t(`speaker.${actor}`);
    box.style.borderColor = SPEECH_COLORS[actor];
    // Keep the portrait on the side of the screen away from the speaker.
    box.classList.toggle('right', at.x < LOGICAL_W / 2);
    box.hidden = false;
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
        b.textContent = text;
        b.addEventListener('click', () => finish(i));
        box.append(b);
      });
      window.addEventListener('keydown', onKey);
      box.hidden = false;
      (box.firstElementChild as HTMLButtonElement | null)?.focus({ preventScroll: true });
    });
  }

  // ------------------------------------------------------ hover, toast ---
  setHover(text: string): void {
    this.hover.textContent = text;
    this.hover.hidden = text === '';
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
    if (!window.confirm(t('ui.confirmImport'))) return;
    this.host.replaceState(result.state);
    this.menu.close();
    this.toast(t('ui.imported'));
  }
}
