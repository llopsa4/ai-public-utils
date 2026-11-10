// A new story: the slow fade and the opening text.
import { t } from '../engine/i18n';
import { lineDuration, settings } from '../engine/settings';
import { $, type Ui } from './ui';
import { sound } from '../audio/sound';
import { STORY_START, loadChapter } from '../chapters';
import { dayLine } from './journalData';
import type { Chapter } from '../chapters/types';
import { INTRO_CARDS } from './introCards';

/**
 * A new story: the screen fades slowly to black, the intro's opening lines appear one after
 * another (click, Enter or Space for the next, Skip or Esc for all), then Silas's cell fades in
 * slowly. The intro ends on the chapter map, where Mara's chapter 1 (with its own opening) starts.
 */
export async function newStory(ui: Ui): Promise<void> {
  if (ui.introActive) return;
  ui.introActive = true;
  // The title theme fades: the opening lines play in silence.
  sound.music('none');
  ui.setHover('');
  const first = await loadChapter(STORY_START, { art: true });
  // Silas's opening: three cards on pure black, one after another in the same place.
  await playCards([
    { main: t(first.intro?.[1] ?? ''), cls: 'card-big' },
    { main: dayLine(first), cls: 'card-day' },
    { main: t(first.intro?.[0] ?? ''), sub: t(first.intro?.[2] ?? ''), cls: 'card-title' },
  ]);
  ui.host.startStory();
  ui.introActive = false;
  fadeIntroAway();
}

/**
 * A later chapter's opening (`Chapter.intro`): its title, then its lines, over black; then the
 * black fades away over the new chapter's first room.
 */
export async function chapterIntro(ui: Ui, keys: readonly string[], day?: string): Promise<void> {
  if (ui.introActive || !keys.length) return;
  ui.introActive = true;
  ui.setHover('');
  await playIntro(keys.slice(1), keys[0], day);
  ui.introActive = false;
  fadeIntroAway();
}

/**
 * A chapter picked on the chapter map: its opening over black (its own lines, or chapter 1's
 * opening), with its day line; then the chapter starts (`start`) and the black fades away.
 */
export async function openChapter(ui: Ui, ch: Chapter, start: () => void): Promise<void> {
  if (ui.introActive) return;
  ui.introActive = true;
  ui.setHover('');
  if (ch.intro?.length) await playIntro(ch.intro.slice(1), ch.intro[0], dayLine(ch), INTRO_CARDS[ch.id]);
  else await playIntro(undefined, undefined, dayLine(ch), INTRO_CARDS[ch.id]);
  start();
  ui.introActive = false;
  fadeIntroAway();
}

/** Timers of a fade-away still running (a new intro cancels them, or they would hide it). */
let fading: number[] = [];

function fadeIntroAway(): void {
  const intro = $('intro');
  // The black fades away over the room's own slow fade-in; play can start at once.
  intro.classList.add('leaving');
  fading.push(window.setTimeout(() => {
    intro.style.setProperty('--intro-fade', '1.6s');
    intro.classList.remove('shown');
    fading.push(window.setTimeout(() => { intro.hidden = true; intro.classList.remove('leaving'); fading = []; }, settings().reducedMotion ? 0 : 1700));
  }, 50));
}

/**
 * Cards on black, each fading in, held a few seconds and fading out, in the same place; a click (or
 * Enter or Space) moves on at once, Escape or Skip ends them.
 */
export function playCards(cards: { main: string; sub?: string; cls: string }[]): Promise<void> {
  const intro = $('intro'), text = $('intro-text'), more = $('intro-more');
  const calm = settings().reducedMotion;
  for (const id of fading) window.clearTimeout(id);
  fading = [];
  const back = $<HTMLImageElement>('intro-backdrop');
  back.hidden = true;
  intro.classList.remove('leaving');
  text.replaceChildren();
  text.classList.remove('out');
  more.classList.remove('in');
  intro.style.setProperty('--intro-fade', '1.8s');
  intro.hidden = false;
  void intro.offsetWidth;
  intro.classList.add('shown');
  return new Promise(resolve => {
    let i = -1, timer = 0, done = false, current: HTMLElement | null = null;
    const wait = (ms: number, then: () => void) => { window.clearTimeout(timer); timer = window.setTimeout(then, calm ? Math.min(ms, 400) : ms); };
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      intro.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey, true);
      $('intro-skip').removeEventListener('click', onSkip);
      text.classList.add('out');
      window.setTimeout(resolve, calm ? 0 : 1300);
    };
    const next = () => {
      if (done) return;
      // The card on screen fades out, then the next one fades in where it was.
      const old = current;
      if (old) { old.classList.remove('in'); window.setTimeout(() => old.remove(), 900); }
      i++;
      if (i >= cards.length) { wait(old ? 900 : 0, finish); return; }
      const c = cards[i];
      const el = document.createElement('div');
      el.className = `intro-card ${c.cls}`;
      const main = document.createElement('p');
      main.textContent = c.main;
      el.append(main);
      if (c.sub) { const sub = document.createElement('p'); sub.className = 'card-sub'; sub.textContent = c.sub; el.append(sub); }
      current = el;
      window.setTimeout(() => { if (done) return; text.append(el); void el.offsetWidth; el.classList.add('in'); }, old ? 950 : 0);
      wait((old ? 950 : 0) + 4400, next);
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
    wait(1600, next);
  });
}

/**
 * The lines over black (chapter 1's opening by default); an optional title comes first, larger, and
 * the chapter's day line ("Day 1 · Morning · Cinderfold") with the first line.
 */
export function playIntro(keys: readonly string[] = ['intro.1', 'intro.2', 'intro.3', 'intro.4'], titleKey?: string, day?: string, backdrop?: string): Promise<void> {
  const intro = $('intro'), text = $('intro-text'), more = $('intro-more');
  // A dim, blurred glimpse of where the chapter begins, behind the lines (src/ui/introCards.ts).
  const back = $<HTMLImageElement>('intro-backdrop');
  back.hidden = !backdrop;
  if (backdrop) back.src = backdrop;
  const calm = settings().reducedMotion;
  const lines = [...(titleKey ? [t(titleKey)] : []), ...keys.map(k => t(k))];
  for (const id of fading) window.clearTimeout(id);
  fading = [];
  intro.classList.remove('leaving');
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
      if (shown === 0 && day) {
        const d = document.createElement('p');
        d.className = 'intro-day';
        d.textContent = day;
        text.append(d);
        void d.offsetWidth;
        d.classList.add('in');
      }
      const p = document.createElement('p');
      if (titleKey && shown === 0) p.className = 'intro-title';
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
