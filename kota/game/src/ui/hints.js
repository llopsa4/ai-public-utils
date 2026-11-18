// First-run hints and place banners (DESIGN-m1.md sections 12 and 13).
// Hints are small banners that never pause play. Each shows once, for 4 s or until the player does the
// action, and the first one carries a "Skip hints" button. Seen hints are saved as `kota.hints`.
// Banners (place names) queue and show for a few seconds. Both use textContent only.

const SEEN_KEY = 'kota.v2.hints';
const LIFE = 4;           // seconds a hint stays up
const DONE_LIFE = 0.6;    // seconds it lingers after the player does the action

export const HINTS = {
  move: 'Drag on either side to move.',
  weapons: 'Your weapons strike on their own. Stay close enough for them to reach.',
  dash: 'Tap dash to roll through threats.',
  ability: 'Ash circle knocks back everything around you.',
  embers: "Gather embers: they fill your bar and trade at the makers' fire.",
  food: 'Walk over food to heal.',
  levelup: 'A helper from the stories offers to help. Choose one.',
  shop: 'Buy weapons and items. Lock an offer to keep it; reroll for new ones.',
  merge: 'Two of the same weapon merge into a stronger one.',
  double_face: 'He strikes in front and behind. Stay at his sides, and trust your ranged weapons.',
  iya: 'Watch for his lunge and keep out of his swallow. He weakens as dawn comes.',
  carried: 'You are carried home. Goods you earned stay with the camp.',
};

export function createHints({ settings, hintEl, textEl, skipEl, bannerEl, titleEl, subEl }) {
  let seen = new Set();
  try { seen = new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { /* ignore */ }
  const save = () => { try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* ignore */ } };

  const queue = [], timers = [];          // hints waiting; hints waiting for a delay
  let current = null;                     // { id, t }
  const banners = []; let bannerNow = null;

  function hideHint() { hintEl.style.display = 'none'; current = null; }

  function pump() {
    if (current || !queue.length) return;
    const id = queue.shift();
    seen.add(id); save();
    current = { id, t: LIFE };
    textEl.textContent = HINTS[id];
    skipEl.style.display = seen.size <= 1 ? '' : 'none';    // only the very first hint offers to skip
    hintEl.style.display = 'flex';
  }

  /** Show a hint once, if hints are on and it has not been seen. */
  function trigger(id) {
    if (!settings.values.hints || !HINTS[id] || seen.has(id) || queue.includes(id) || current?.id === id) return;
    queue.push(id); pump();
  }
  /** Show a hint after a delay (seconds of play). */
  function later(id, delay) { if (!seen.has(id)) timers.push({ id, t: delay }); }
  /** The player did the action a hint asks for: let it fade soon. */
  function done(id) { if (current?.id === id) current.t = Math.min(current.t, DONE_LIFE); }

  /** Queue a place banner: a title and an optional line under it. */
  function banner(title, sub = '', secs = 2.5) { banners.push({ title, sub, secs }); }

  function update(dt) {
    for (const x of timers.slice()) {
      x.t -= dt;
      if (x.t <= 0) { timers.splice(timers.indexOf(x), 1); trigger(x.id); }
    }
    if (current) {
      current.t -= dt;
      if (current.t <= 0) { hideHint(); pump(); }
    }
    if (bannerNow) {
      bannerNow.t -= dt;
      if (bannerNow.t <= 0) { bannerEl.classList.remove('show'); bannerNow = null; }
    }
    if (!bannerNow && banners.length) {
      const b = banners.shift();
      titleEl.textContent = b.title; subEl.textContent = b.sub;
      bannerEl.classList.add('show'); bannerNow = { t: b.secs };
    }
  }

  skipEl.addEventListener('click', () => settings.set('hints', false));
  settings.onChange((key, value) => {
    if (key !== 'hints') return;
    if (!value) { queue.length = 0; timers.length = 0; hideHint(); }
    else { seen.clear(); save(); }                           // turning hints back on replays them
  });

  return { trigger, later, done, banner, update, seen: () => [...seen] };
}
