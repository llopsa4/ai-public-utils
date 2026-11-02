import { ITEM_ICONS, PORTRAITS, VERB_ICONS } from '../game/assets';
import { LANGUAGES, language, onLanguageChange, setLanguage, t, type Language } from '../engine/i18n';
import { MAX_SAVE_BYTES, parseSave, saveFileName, serializeSave } from '../engine/saveFile';
import { lineDuration, onSettingsChange, settings, updateSettings, type Settings } from '../engine/settings';
import { objectives } from '../content/objectives';
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
  /** Labels for everything interactive in the room, in world coordinates. */
  hotspotLabels(): { text: string; x: number; y: number }[];
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
  private readonly history: { actor: ActorId; text: string }[] = [];
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
    $('menu-export').addEventListener('click', () => this.exportSave());
    $('menu-import').addEventListener('click', () => this.fileInput.click());
    $('end-new').addEventListener('click', () => { this.hideEnd(); this.host.replaceState(this.host.newGame()); });
    $('menu-history').addEventListener('click', () => { this.menu.close(); this.openHistory(); });
    $('menu-settings').addEventListener('click', () => { this.menu.close(); this.openSettings(); });
    $('notebook-btn').addEventListener('click', () => this.openNotebook());
    $('reveal-btn').addEventListener('click', () => this.revealFor(3000));
    const mute = $('mute-btn');
    const showMute = (s: Settings) => { mute.setAttribute('aria-pressed', String(s.muted)); mute.innerHTML = s.muted ? '&#128263;' : '&#128264;'; };
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
      if (window.confirm(t('ui.confirmNew'))) { this.host.replaceState(this.host.newGame()); this.menu.close(); }
    });
    this.fileInput.addEventListener('change', () => void this.importSave());
    this.menu.addEventListener('click', e => { if (e.target === this.menu) this.menu.close(); });
    window.addEventListener('keydown', e => {
      if (e.key === ' ' && !e.repeat && !this.anyDialogOpen() && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
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
    this.overlay.style.fontSize = `${Math.max(13, Math.round(7.5 * this.zoom))}px`;
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
  say(actor: ActorId, text: string, _at: Point): Promise<void> {
    this.skipSpeech?.();
    const panel = this.dialogue;
    const portrait = $<HTMLImageElement>('dialogue-portrait');
    const url = PORTRAITS[actor === 'hero' ? 'mara' : actor];
    portrait.hidden = !url;
    if (url) portrait.src = url;
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
        if (this.skipSpeech === done) { this.skipSpeech = null; panel.hidden = true; }
        resolve();
      };
      const timer = s.autoAdvance ? window.setTimeout(done, lineDuration(text, s.textSpeed)) : 0;
      this.skipSpeech = done;
    });
  }

  clearHistory(): void {
    this.history.length = 0;
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
    $<HTMLDialogElement>('notebook').showModal();
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

  private openSettings(): void {
    const form = $<HTMLFormElement>('settings-form');
    const s = settings();
    (form.elements.namedItem('textSpeed') as HTMLSelectElement).value = s.textSpeed;
    (form.elements.namedItem('volume') as HTMLInputElement).value = String(s.volume);
    for (const k of ['muted', 'autoAdvance', 'reducedMotion'] as const) (form.elements.namedItem(k) as HTMLInputElement).checked = s[k];
    $<HTMLDialogElement>('settings').showModal();
  }

  private bindSettingsForm(): void {
    const form = $<HTMLFormElement>('settings-form');
    form.addEventListener('submit', e => e.preventDefault());
    form.addEventListener('input', () => {
      const el = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
      updateSettings({
        textSpeed: (form.elements.namedItem('textSpeed') as HTMLSelectElement).value as Settings['textSpeed'],
        volume: Number(el('volume').value),
        muted: el('muted').checked,
        autoAdvance: el('autoAdvance').checked,
        reducedMotion: el('reducedMotion').checked,
      });
    });
    onSettingsChange(s => document.documentElement.classList.toggle('reduce-motion', s.reducedMotion));
    document.documentElement.classList.toggle('reduce-motion', settings().reducedMotion);
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
