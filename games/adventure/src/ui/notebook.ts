// Mara's notebook (goals, hints, secrets, people met) and the history of what was said.
import { t } from '../engine/i18n';
import { chapter } from '../chapters';
import { $, SPEECH_COLORS, type Ui } from './ui';
import { renderDiary, renderMap } from './journal';
import { dayLine } from './journalData';

export function openNotebook(ui: Ui): void {
  const list = $('objectives');
  list.replaceChildren();
  for (const o of chapter().objectives(ui.host.getState())) {
    const li = document.createElement('li');
    li.textContent = t(o.key) + (o.optional ? ` ${t('ui.optional')}` : '');
    li.classList.toggle('done', o.done);
    list.append(li);
  }
  const found = chapter().secretFlags.filter(f => ui.host.getState().flags[f]).length;
  const secrets = $('secrets');
  secrets.hidden = found === 0;
  secrets.textContent = t('ui.secrets', { found: String(found), total: String(chapter().secretFlags.length) });
  // What Mara noted about each one found (`note.<flag>`); the rest stay unmentioned.
  const notes = $('secret-list');
  const noteKeys=[...chapter().secretFlags.filter(f => ui.host.getState().flags[f]).map(f=>`note.${f}`),...(chapter().reflections?.(ui.host.getState())??[])];
  notes.replaceChildren(...noteKeys.map(key => {
    const li = document.createElement('li');
    li.textContent = t(key);
    return li;
  }));
  notes.hidden = noteKeys.length === 0;
  const met = chapter().metFlags.filter(f => ui.host.getState().flags[f]).length;
  $('met').hidden = met === 0;
  $('met').textContent = t('ui.met', { found: String(met), total: String(chapter().metFlags.length) });
  renderHint(ui);
  // Whose notebook, which day, the story so far and where they are (ui/journal.ts).
  const ch = chapter(), state = ui.host.getState();
  $('notebook-heading').textContent = t('ui.notebookOf', { who: t(ch.when.viewpoint) });
  $('notebook-day').textContent = dayLine(ch);
  renderDiary($('diary'), state);
  renderMap($('world-map'), state);
  $<HTMLDialogElement>('notebook').showModal();
}

/** The first unfinished required goal: the one hints are about. */
export function currentGoal(ui: Ui): string | null {
  return chapter().objectives(ui.host.getState()).find(o => !o.done && !o.optional)?.key ?? null;
}

/** Hints come in two stages per goal: a nudge, then the plain answer. */
export function renderHint(ui: Ui): void {
  const goal = currentGoal(ui);
  const button = $<HTMLButtonElement>('hint-btn');
  const text = $('hint-text');
  $('hint-box').hidden = !goal;
  if (!goal) return;
  const stage = ui.hintStage.get(goal) ?? 0;
  text.textContent = stage > 0 ? t(`hint.${goal.slice(4)}.${stage}`) : '';
  text.hidden = stage === 0;
  button.hidden = stage >= 2;
  button.textContent = t(stage === 0 ? 'ui.hint' : 'ui.hintMore');
}

export function nextHint(ui: Ui): void {
  const goal = currentGoal(ui);
  if (!goal) return;
  ui.hintStage.set(goal, Math.min(2, (ui.hintStage.get(goal) ?? 0) + 1));
  renderHint(ui);
  ui.live.textContent = $('hint-text').textContent ?? '';
}

export function openHistory(ui: Ui): void {
  const list = $('history-list');
  list.replaceChildren();
  if (ui.history.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = t('ui.historyEmpty');
    list.append(li);
  }
  for (const line of ui.history) {
    const li = document.createElement('li');
    const who = document.createElement('strong');
    who.textContent = `${line.name ?? t(`speaker.${line.actor}`)}: `;
    who.style.color = SPEECH_COLORS[line.actor];
    li.append(who, line.text);
    list.append(li);
  }
  const dialog = $<HTMLDialogElement>('history');
  dialog.showModal();
  list.lastElementChild?.scrollIntoView({ block: 'end' });
}
