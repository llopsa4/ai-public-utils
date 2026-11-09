// The debug panel (only with ?debug; comma toggles it, ?debug=panel opens it at start): jump to a
// chapter, room or set of flags; give items, salvage, tonics and gear; start a fight; switch the
// visual quality and the walk-area overlay. Loaded on demand, so it is not in the normal game.
import { CHAPTERS, CHAPTER_IDS, chapter, loadChapter } from '../chapters';
import { t } from '../engine/i18n';
import { dayLine } from './journalData';
import { ALL_GEAR, TONIC } from '../content/kit';
import { equip } from '../engine/kit';
import { settings, updateSettings } from '../engine/settings';
import { applyCommand, newGame } from '../engine/state';
import type { GameState } from '../engine/types';
import { roomFlags } from '../engine/roomFlags';
import type { Session } from '../game/session';

const CSS = `
#debug-panel { position: fixed; top: 8px; right: 8px; z-index: 9999; width: 300px; max-height: calc(100vh - 16px); overflow: auto;
  background: rgba(16, 12, 10, 0.94); color: #f0e0c8; font: 12px/1.4 system-ui, sans-serif; border: 1px solid #a0703c;
  border-radius: 6px; padding: 8px 10px; box-shadow: 0 4px 18px #000a; }
#debug-panel[hidden] { display: none; }
#debug-panel h2 { font-size: 12px; margin: 10px 0 4px; color: #ffc860; text-transform: uppercase; letter-spacing: 0.06em; }
#debug-panel h2:first-child { margin-top: 0; }
#debug-panel label { display: inline-flex; gap: 3px; align-items: center; margin: 0 8px 2px 0; white-space: nowrap; }
#debug-panel button, #debug-panel select { font: inherit; margin: 0 4px 4px 0; background: #3a2a20; color: inherit;
  border: 1px solid #a0703c; border-radius: 3px; padding: 1px 6px; cursor: pointer; }
#debug-panel .row { display: flex; flex-wrap: wrap; }
`;

export function mountDebugPanel(session: Session): void {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const panel = document.createElement('aside');
  panel.id = 'debug-panel';
  panel.hidden = new URLSearchParams(location.search).get('debug') !== 'panel';
  document.body.append(panel);
  window.addEventListener('keydown', e => {
    if (e.key !== ',') return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) render();
  });
  // Keep up with the game while open: another chapter or room, or flags set by playing.
  let shown = '';
  const key = () => { const s = session.state; return `${s.chapter}|${s.room}|${Object.keys(s.flags).filter(f => s.flags[f]).sort().join(',')}`; };
  window.setInterval(() => { if (!panel.hidden && key() !== shown) render(); }, 500);
  /** The flags list: this room's (default) or the whole chapter's. */
  let allFlags = false;

  /** Plays on from a changed copy of the game (the room restarts). */
  const change = (edit: (s: GameState) => void) => {
    const s = structuredClone(session.state);
    edit(s);
    session.replaceState(s);
    render();
  };
  const el = <T extends HTMLElement = HTMLElement>(tag: string, props: Record<string, unknown> = {}, ...kids: (Node | string)[]): T => {
    const e = Object.assign(document.createElement(tag), props) as T;
    e.append(...kids);
    return e;
  };
  const button = (text: string, onclick: () => void) => el('button', { type: 'button', textContent: text, onclick });
  const check = (text: string, checked: boolean, onchange: (on: boolean) => void) => {
    const box = el<HTMLInputElement>('input', { type: 'checkbox', checked });
    box.onchange = () => onchange(box.checked);
    return el('label', {}, box, text);
  };

  function render(): void {
    if (panel.hidden) return;
    shown = key();
    const s = session.state;
    const c = chapter();
    panel.replaceChildren();

    panel.append(el('h2', { textContent: 'Chapter and room' }));
    const chapterSelect = el<HTMLSelectElement>('select');
    // A loaded chapter shows its title; one not fetched yet, its id.
    const label = (id: string) => (CHAPTERS[id] ? t(CHAPTERS[id].title) : id);
    for (const id of CHAPTER_IDS) chapterSelect.append(el('option', { value: id, textContent: label(id), selected: id === s.chapter }));
    // Jumping to a chapter is the real chapter change (kit, bag and kept items carry over),
    // after fetching the chapter if it isn't loaded yet.
    chapterSelect.onchange = () => {
      const id = chapterSelect.value;
      void loadChapter(id, { art: true }).then(async next => {
        // As in the game: the chapter's opening lines, the first time this save enters it.
        if (next.intro && !session.state.reached.includes(id)) await session.ui.chapterIntro(next.intro, dayLine(next));
        // Another hero's chapter (Silas's intro) starts their own thread: nothing of Mara's carries over.
        if (next.hero) session.replaceState(newGame(id));
        else change(st => applyCommand(st, { type: 'chapter', id }));
      });
    };
    const roomSelect = el<HTMLSelectElement>('select');
    for (const id of Object.keys(c.rooms)) roomSelect.append(el('option', { value: id, textContent: id, selected: id === s.room }));
    roomSelect.onchange = () => change(st => {
      const room = c.rooms[roomSelect.value];
      const entry = Object.values(room.entries)[0];
      Object.assign(st, { room: room.id, hero: { ...st.hero, x: entry.x, y: entry.y, face: entry.face, pose: 'stand' } });
    });
    panel.append(el('div', { className: 'row' }, chapterSelect, roomSelect, button('New game', () => session.replaceState(newGame(s.chapter)))));

    // Flags: those of the room shown (src/engine/roomFlags.ts), or all the chapter's.
    const here = roomFlags(c, s.room);
    panel.append(el('h2', { textContent: allFlags ? `Flags: all of ${s.chapter}` : `Flags: this room (${s.room})` }));
    panel.append(el('div', { className: 'row' }, check(`All flags (${c.flags.length})`, allFlags, on => { allFlags = on; render(); })));
    const flags = el('div', { className: 'row' });
    for (const f of allFlags ? c.flags : here) flags.append(check(f, !!s.flags[f], on => change(st => { if (on) st.flags[f] = true; else delete st.flags[f]; })));
    if (!allFlags && !here.length) flags.append(el('span', { textContent: 'No story flags in this room.' }));
    panel.append(flags);

    panel.append(el('h2', { textContent: 'Mara’s outfit' }));
    panel.append(check('Medium armour', s.kit.equipment.armor.id === 'layered-armor'
      && (s.chapter !== 'ch1' || !!(s.flags.dressed || s.flags.hasGauntlet)), on => change(st => {
      const armor = on ? 'layered-armor' : 'patched-coat';
      if (!st.kit.owned.includes(armor)) st.kit.owned.push(armor);
      equip(st.kit, 'armor', armor, true);
      if (st.chapter === 'ch1') st.flags.dressed = true;
    })));
    panel.append(el('p', { textContent: 'Off selects light armour. Gauntlet power uses hasGauntlet.' }));

    panel.append(el('h2', { textContent: 'Items' }));
    const items = el('div', { className: 'row' });
    for (const i of c.items) items.append(check(i, s.inventory.includes(i), on => change(st => {
      st.inventory = on ? [...st.inventory, i] : st.inventory.filter(x => x !== i);
    })));
    panel.append(items);

    panel.append(el('h2', { textContent: `Kit: ${s.kit.hp} HP, ${s.bag.salvage} salvage, ${s.bag.tonics} tonics` }));
    panel.append(el('div', { className: 'row' },
      button('+10 salvage', () => change(st => { st.bag.salvage += 10; })),
      button('+1 tonic', () => change(st => { st.bag.tonics = Math.min(TONIC.max, st.bag.tonics + 1); })),
      button('All gear', () => change(st => { st.kit.owned = [...ALL_GEAR]; })),
      button('Full health', () => change(st => { st.kit.hp = 60; })),
      button('Gear screen', () => void session.ui.openGear()),
      button('Shop', () => void session.ui.openShop()),
    ));

    panel.append(el('h2', { textContent: 'Fights' }));
    panel.append(el('div', { className: 'row' }, ...Object.keys(c.encounters).map(id =>
      button(id, () => { panel.hidden = true; void session.scene?.runScript([{ type: 'fight', id }]); }))));

    panel.append(el('h2', { textContent: 'View' }));
    panel.append(el('div', { className: 'row' },
      check('High quality', settings().visualQuality === 'high', on => updateSettings({ visualQuality: on ? 'high' : 'low' })),
      check('Walk areas', session.showWalkAreas, on => { session.showWalkAreas = on; session.scene?.scene.restart(); }),
    ));
  }
  render();
}
