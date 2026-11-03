// A new story: the slow fade and the opening text.
import { t } from '../engine/i18n';
import { lineDuration, settings } from '../engine/settings';
import { $, type Ui } from './ui';

/**
 * A new story: the screen fades slowly to black, a few lines of context appear one after
 * another (click, Enter or Space for the next, Skip or Esc for all), then the game starts and
 * its first room fades in slowly.
 */
export async function newStory(ui: Ui): Promise<void> {
  if (ui.introActive) return;
  ui.introActive = true;
  ui.setHover('');
  await playIntro();
  ui.host.startStory();
  ui.introActive = false;
  const intro = $('intro');
  // The black fades away over the room's own slow fade-in; play can start at once.
  intro.classList.add('leaving');
  window.setTimeout(() => {
    intro.style.setProperty('--intro-fade', '1.6s');
    intro.classList.remove('shown');
    window.setTimeout(() => { intro.hidden = true; intro.classList.remove('leaving'); }, settings().reducedMotion ? 0 : 1700);
  }, 50);
}

export function playIntro(): Promise<void> {
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
