import { STORAGE_KEY, KINDS, WEEKDAYS, HOURS, pad, todayMonth, emptyState, newMonth, monthDates, weekday, shiftMonth, holiday, slotsForDate, slotsForMonth, slotKey, participantCode, totals, allAssignments, ruleIssues, structuralIssues, audit, serialize, parseBackup, anonymousState } from './core.mjs';
import { CITIES, HOLIDAY_DATA, cityById, findCity, cityYearAvailable, holidayDetails } from './holidays.mjs';
import { coverageStatus, movedAssignments, moveTargets, exclusiveKinds, holidayDutyLimit } from './core.mjs';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const names = new Map(); // Never include this map in persistence, backups, worker messages, or URLs.
const kindLabel = kind => ({ '24': '24 hours', day: 'Day · 12 hours', night: 'Night · 12 hours' }[kind]);
const shortKind = kind => ({ '24': '24h', day: 'Day', night: 'Night' }[kind]);
const timeLabel = kind => ({ '24': '09:00–09:00 +1', day: '09:00–21:00', night: '21:00–09:00 +1' }[kind]);
const splitChoices = new Set(); // Temporary choices for editing an otherwise empty holiday place.
const monthTitle = month => new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dateTitle = date => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
let state = emptyState(), month = todayMonth(), selectedId = null, openDate = null;
let storageBlocked = false, worker = null, latestProposal = null;
let migratedShiftPermissions = false;
let moving = null, pointer = null, suppressClickUntil = 0;
let selectedAssignmentKey = null;
let calendarParticipantId = null; // View-only; never persist this filter or session names.
let participantDraft = null, participantDirty = false;
let setupStep = null, setupSubmitting = false, setupReviewPending = false, saveFailed = false;
let setupCount = 0, setupCreatedIds = [], setupPeople = [], setupPersonIndex = 0;
const assignmentDrafts = new Map(); // Anonymous pending selections for the open date only.

function notify(message, error = false) {
  $('#message').textContent = message;
  $('#message').classList.toggle('error', error);
  $('#message').hidden = false;
  if ($('#setup-dialog').open) { $('#setup-error').textContent = message; $('#setup-error').hidden = false; }
}
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    state = parseBackup(saved);
    const oldParticipants = JSON.parse(saved).participants;
    const mixed = oldParticipants.filter(p => p.allowedKinds.includes('24') && p.allowedKinds.some(kind => kind !== '24')).length;
    if (mixed) {
      migratedShiftPermissions = true;
      notify(`${mixed} participant(s) with mixed shift permissions now default to 24 hours. Choose 12-hour day/night duties in their settings if needed. Existing assignments were kept; review any permission warnings.`);
    }
  }
} catch {
  storageBlocked = true;
  notify('Saved data could not be read. It has not been overwritten. Export this session as a backup, or import a valid backup to resume saving.', true);
}
function ensureMonth() {
  state.months[month] ??= newMonth();
  if (state.cityId) state.months[month].cityId = state.cityId;
}
function renderCity() {
  const city = cityById(state.cityId);
  $('#city-input').value = city?.label ?? '';
  $('#city-highlight').textContent = city ? `${city.name} · Catalonia` : 'No city selected';
  $('#city-highlight').classList.toggle('selected', Boolean(city));
  $('#clear-city').disabled = !city;
  const available = city && cityYearAvailable(city.id, month.slice(0, 4));
  $('#city-status').classList.toggle('unavailable', Boolean(city && !available));
  if (!city) $('#city-status').textContent = `Choose a listed city to mark local and public holidays. Official snapshot available for ${HOLIDAY_DATA.year}; weekends and manual dates work in every year.`;
  else if (!available) $('#city-status').textContent = `Official dates for ${month.slice(0, 4)} are not available in the bundled snapshot. Mark dates manually; no dates are copied from ${HOLIDAY_DATA.year}.`;
  else {
    const count = HOLIDAY_DATA.cities[city.id].dates.length;
    $('#city-status').textContent = `${HOLIDAY_DATA.year} official snapshot: ${count} local holiday date${count === 1 ? '' : 's'} plus Catalonia-wide public holidays. ${count < 2 ? 'Only one municipal date was published in this snapshot; verify the other with the council.' : 'Existing assignments are kept and rechecked against these dates.'}`;
  }
}
function setCity(city) {
  if (city) state.cityId = city.id; else delete state.cityId;
  for (const config of Object.values(state.months)) {
    if (city) config.cityId = city.id; else delete config.cityId;
  }
  changed();
  notify(city ? `City set to ${city.name}. Official holidays now apply to scheduling and workload checks. Review any new warnings before regenerating.` : 'City cleared. Official city/public dates were removed; weekends and manually added holidays were kept.');
}
function personLabel(id) {
  const p = state.participants.find(p => p.id === id);
  return names.get(id)?.trim() || (p ? `Participant ${p.code}` : 'Unknown participant');
}
function save() {
  if (storageBlocked) { $('#save-status').textContent = 'Not saved · export a backup'; return; }
  try {
    localStorage.setItem(STORAGE_KEY, serialize(state));
    saveFailed = false;
    $('#save-status').textContent = 'Anonymous data saved';
  } catch {
    saveFailed = true;
    $('#save-status').textContent = 'Not saved · export a backup';
    notify('Browser storage is unavailable or full. Export an anonymous backup before closing this page.', true);
  }
}
function render() {
  ensureMonth();
  $('#month-title').textContent = monthTitle(month);
  $('#month-input').value = month;
  renderCity();
  renderParticipants(); renderEditor(); renderCalendar(); renderTotals(); renderIssues();
}
function renderParticipants() {
  $('#participant-count').textContent = state.participants.length;
  $('#participants').innerHTML = state.participants.length ? state.participants.map(p => `<button class="participant-button ${p.id === selectedId ? 'active' : ''}" data-person="${p.id}" aria-haspopup="dialog" aria-controls="participant-dialog"><span>${escape(personLabel(p.id))}</span><small>${participantCode(p)}</small></button>`).join('') : '<p class="empty-state">Start with your team.<br>Add participants, then set availability.</p>';
}
function renderEditor() {
  const p = state.participants.find(p => p.id === selectedId);
  if (!p) { participantDraft = null; participantDirty = false; $('#participant-editor').innerHTML = ''; return; }
  $('#participant-title').textContent = `${participantCode(p)} · Participant settings`;
  if (!participantDraft || participantDraft.id !== p.id || participantDraft.month !== month) {
    participantDraft = { id: p.id, month, name: names.get(p.id) || '', allowedKinds: [...p.allowedKinds], blockedWeekdays: [...p.blockedWeekdays],
      blockedDates: p.blockedDates.filter(d => d.startsWith(month)).sort() };
    participantDirty = false;
  }
  const guided = setupPeople.length > 0;
  $('#participant-setup-progress').hidden = !guided;
  $('#participant-setup-progress').textContent = guided ? `Participant ${setupPersonIndex + 1} of ${setupPeople.length}. Confirm to continue, or skip this person for now.` : '';
  const draft = participantDraft;
  const shiftChoice = kind => `<label class="checkbox-label"><input type="checkbox" data-kind="${kind}" ${draft.allowedKinds.includes(kind) ? 'checked' : ''} ${(kind === '24' ? draft.allowedKinds.some(k => k !== '24') : draft.allowedKinds.includes('24')) ? 'disabled' : ''}>${kindLabel(kind)}</label>`;
  $('#participant-editor').innerHTML = `<form class="participant-editor" id="participant-form">
    <h3>${participantCode(p)} · Availability</h3>
    <label>Name · session only<input id="person-name" type="text" maxlength="80" autocomplete="off" spellcheck="false" value="${escape(draft.name)}" placeholder="Participant ${p.code}"></label>
    <fieldset><legend>Allowed shift types</legend><div class="shift-families" aria-describedby="shift-choice-hint"><div class="shift-family"><p class="shift-family-title">24-hour duty</p><div class="checkbox-list">${shiftChoice('24')}</div></div><div class="shift-family"><p class="shift-family-title">12-hour duties</p><div class="checkbox-list">${shiftChoice('day')}${shiftChoice('night')}</div></div></div><p class="muted" id="shift-choice-hint">Uncheck the current choice to switch between 24h and 12h. Day and night may both be selected. Monthly holiday allowance: one 24h duty or two 12h duties on separate dates.</p></fieldset>
    <fieldset><legend>Blocked weekdays · every month</legend><div class="checkbox-list weekday-choices">${[1, 2, 3, 4, 5, 6, 0].map(d => `<label class="checkbox-label"><input type="checkbox" data-weekday="${d}" ${draft.blockedWeekdays.includes(d) ? 'checked' : ''}>${WEEKDAYS[d]}</label>`).join('')}</div></fieldset>
    ${blockedDatePicker(draft)}
    <p id="participant-edit-status" class="muted" role="status">${participantDirty ? 'Unconfirmed changes. Confirm to apply them.' : 'Changes apply only after confirmation. Names stay in this session.'}</p>
    <div class="participant-edit-actions"><button type="submit" class="primary" id="confirm-participant" ${participantDirty || guided ? '' : 'disabled'}>${guided ? 'Confirm and continue' : 'Confirm participant changes'}</button><button type="button" id="cancel-participant">${guided ? 'Skip for now' : 'Cancel changes'}</button></div>
    <button type="button" class="danger remove-person" id="remove-person" ${guided ? 'hidden' : ''}>Delete participant</button>
  </form>`;
}

function blockedDatePicker(draft) {
  const dates = monthDates(draft.month), selected = new Set(draft.blockedDates);
  const offset = (weekday(dates[0]) + 6) % 7;
  const first = draft.blockedDates[0] ?? dates[0];
  return `<fieldset class="blocked-date-picker"><legend>Blocked dates · ${escape(monthTitle(draft.month))}</legend><div class="blocked-date-weekdays" aria-hidden="true">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span>${d}</span>`).join('')}</div><div class="blocked-date-grid" role="group" aria-label="Choose blocked dates for ${escape(monthTitle(draft.month))}">${'<span aria-hidden="true"></span>'.repeat(offset)}${dates.map(date => `<button type="button" class="blocked-date ${selected.has(date) ? 'selected' : ''} ${[0, 6].includes(weekday(date)) ? 'weekend' : ''}" data-block-date="${date}" aria-pressed="${selected.has(date)}" aria-label="${escape(dateTitle(date))}, ${selected.has(date) ? 'blocked' : 'not selected'}" tabindex="${date === first ? 0 : -1}">${Number(date.slice(-2))}</button>`).join('')}</div><p class="muted" id="blocked-date-count">${selected.size} date${selected.size === 1 ? '' : 's'} selected</p><p id="blocked-hint" class="muted">Select dates to block for this month. Select again to unblock. Weekday restrictions above apply separately.</p></fieldset>`;
}

function discardParticipantDraft() {
  if (participantDirty && !confirm('Discard unconfirmed participant changes? Confirm them first to keep them.')) {
    $('#confirm-participant').focus(); return false;
  }
  participantDraft = null; participantDirty = false; return true;
}
function currentToday() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function renderCalendar(proposal = null) {
  if (!state.participants.some(p => p.id === calendarParticipantId)) calendarParticipantId = null;
  const individual = Boolean(calendarParticipantId);
  $('#participant-view').innerHTML = '<option value="">All participants</option>' + state.participants.map(p => `<option value="${p.id}">${escape(personLabel(p.id))} · ${participantCode(p)}</option>`).join('');
  $('#participant-view').value = calendarParticipantId ?? '';
  const config = proposal ? { ...state.months[month], assignments: proposal } : state.months[month];
  const view = { ...state, months: { ...state.months, [month]: config } };
  const issues = audit(view, month);
  const issueKeys = new Set(issues.map(i => slotKey(i.assignment)));
  const dates = monthDates(month), offset = (weekday(dates[0]) + 6) % 7;
  const targets = moving ? moveTargets(state, month, moving.key) : [];
  const targetKeys = new Set(targets.map(slotKey));
  const cells = Array.from({ length: offset }, () => '<div class="empty-cell" aria-hidden="true"></div>');
  for (const date of dates) {
    const holidayInfo = holidayDetails(date, config);
    const holidayBadge = holidayInfo.label && holidayInfo.label !== 'Weekend' ? `<span class="holiday-tag ${holidayInfo.local ? 'local' : holidayInfo.general ? 'public' : 'other'}">${escape(holidayInfo.label)}</span>` : '';
    const daySlots = slotsForDate(date, config).flatMap(s =>
      moving && s.kind === '24' && targets.some(t => t.date === date && t.seat === s.seat && t.kind !== '24')
        ? ['day', 'night'].map(kind => ({ ...s, kind })) : [s]);
    const assigned = config.assignments.filter(a => a.date === date);
    const visibleAssigned = assigned.filter(a => !individual || a.participantId === calendarParticipantId);
    const workday = individual && visibleAssigned.length > 0;
    const stale = visibleAssigned.filter(a => !daySlots.some(s => slotKey(s) === slotKey(a)));
    const lines = daySlots.map(s => {
      const a = assigned.find(a => slotKey(a) === slotKey(s));
      const key = slotKey(s), target = targetKeys.has(key);
      if (individual && !target && (!a || a.participantId !== calendarParticipantId)) return '';
      const content = `<span class="slot-kind">${shortKind(s.kind)}</span><span class="slot-name">${a ? escape(personLabel(a.participantId)) : target ? 'Move here' : 'Unfilled'}</span>`;
      const label = `${dateTitle(date)}, ${kindLabel(s.kind)}, place ${s.seat + 1}`;
      if (a) return `<button type="button" class="slot-line move-entry ${issueKeys.has(key) ? 'conflict' : ''} ${moving?.key === key ? 'move-source' : ''}" data-move="${key}" ${worker || moving ? 'disabled' : ''} aria-haspopup="dialog" aria-controls="assignment-dialog" aria-label="${escape(`Assignment options: ${personLabel(a.participantId)}, ${label}`)}">${content}<span class="move-hint" aria-hidden="true">↔</span></button>`;
      if (target) return `<button type="button" class="slot-line pending drop-target" data-drop="${key}" aria-label="${escape(`Move here: ${label}`)}">${content}</button>`;
      return `<span class="slot-line pending">${content}</span>`;
    }).join('');
    const dayCovered = daySlots.filter(s => assigned.some(a => slotKey(a) === slotKey(s))).length;
    const staleLines = stale.map(a => `<button type="button" class="slot-line move-entry conflict" data-move="${slotKey(a)}" ${worker || moving ? 'disabled' : ''} aria-haspopup="dialog" aria-controls="assignment-dialog" aria-label="${escape(`Assignment options: ${personLabel(a.participantId)}, incompatible ${kindLabel(a.kind)}, ${dateTitle(date)}`)}"><span class="slot-kind">${shortKind(a.kind)}</span><span class="slot-name">${escape(personLabel(a.participantId))}</span><span class="move-hint" aria-hidden="true">↔</span></button>`).join('');
    const { missing: unfilled, overstaffed } = coverageStatus(date, assigned);
    cells.push(`<div class="day-cell ${holidayInfo.weekend ? 'weekend' : ''} ${holiday(date, config) ? 'holiday' : ''} ${holidayInfo.local ? 'local-holiday' : ''} ${holidayInfo.general ? 'public-holiday' : ''} ${individual ? `participant-day ${workday ? 'participant-workday' : ''}` : `${unfilled ? 'unfilled' : overstaffed ? '' : 'covered'} ${overstaffed ? 'overstaffed' : ''}`} ${date === currentToday() ? 'today' : ''}" data-date="${date}"><button type="button" class="date-row date-open" ${worker || moving ? 'disabled' : ''} aria-label="${escape(`Open ${dateTitle(date)}`)}, ${escape(holidayInfo.name || 'non-holiday')}, ${individual ? `${visibleAssigned.length} duties for ${escape(personLabel(calendarParticipantId))}` : `${dayCovered} of ${daySlots.length} seats filled${unfilled ? ', missing coverage' : ''}${overstaffed ? ', overstaffed or overlapping coverage' : ''}`}${stale.length ? ', incompatible assignments need attention' : ''}"><span class="date-number">${Number(date.slice(-2))}</span><span class="date-mode">${individual ? workday ? 'On duty' : 'No duty' : unfilled ? 'Needs cover' : 'Covered'}</span></button>${holidayBadge}${!individual && overstaffed ? '<span class="coverage-warning">Overstaffed / overlapping coverage</span>' : ''}${lines}${stale.length ? `<span class="slot-line conflict">${stale.length} incompatible</span>${staleLines}` : ''}</div>`);
  }
  while (cells.length % 7) cells.push('<div class="empty-cell" aria-hidden="true"></div>');
  $('#month-grid').innerHTML = cells.join('');
  $('#month-grid').classList.toggle('participant-view', individual);
  $('#coverage-legend').hidden = individual; $('#participant-view-legend').hidden = !individual;
  const duties = config.assignments.filter(a => a.participantId === calendarParticipantId);
  $('#participant-view-status').hidden = !individual;
  $('#participant-view-status').textContent = individual ? `${personLabel(calendarParticipantId)} · ${new Set(duties.map(a => a.date)).size} workdays in ${monthTitle(month)}. Only this participant’s duties are shown.` : '';
  $('#move-controls').hidden = !moving;
  $('#move-status').textContent = moving ? `Moving ${kindLabel(moving.kind)} duty. Choose a highlighted spot. ${targets.length} valid spots. Escape cancels.` : '';
  for (const id of ['previous', 'next', 'today', 'month-input', 'generate', 'apply-city', 'clear-city', 'city-input', 'restore', 'add-participant', 'print', 'participant-view']) {
    const el = $(`#${id}`);
    el.disabled = Boolean(worker || moving) || (id === 'clear-city' && !state.cityId);
  }
  for (const button of $('#participants').querySelectorAll('button')) button.disabled = Boolean(worker || moving);
}
function renderTotals() {
  const t = totals(state, month), values = Object.values(t), hours = values.map(v => v.hours);
  $('#balance-note').textContent = values.length ? `${Math.min(...hours)}–${Math.max(...hours)} hours per person` : 'No participants yet';
  $('#workloads').innerHTML = state.participants.map(p => `<tr><td>${escape(personLabel(p.id))} <small class="muted">${participantCode(p)}</small></td><td><strong>${t[p.id].hours}</strong></td><td class="${t[p.id].holidayHours > 24 ? 'over-limit' : ''}">${t[p.id].holidays} / ${holidayDutyLimit(p)}<br><small>${t[p.id].holidayHours} / 24h</small></td><td class="${t[p.id].ordinary > 3 ? 'over-limit' : ''}">${t[p.id].ordinary}</td><td>${t[p.id].weekends}</td></tr>`).join('') || '<tr><td colspan="5">Add participants to see the workload.</td></tr>';
}
function renderIssues() {
  const config = state.months[month], assignments = config.assignments;
  const missing = slotsForMonth(month, config).filter(s => !assignments.some(a => slotKey(a) === slotKey(s)));
  const issues = audit(state, month);
  const dates = monthDates(month), holidayDates = dates.filter(d => holiday(d, config)).length;
  const holidaySeats = holidayDates * 2;
  const lines = [];
  if (state.cityId && !cityYearAvailable(state.cityId, month.slice(0, 4))) lines.push(`<li class="warning">Official city/public holiday data for ${month.slice(0, 4)} is unavailable. Add holidays manually before generating.</li>`);
  const eligible = state.participants.filter(p => exclusiveKinds(p.allowedKinds).length).length;
  if (eligible < holidaySeats) lines.push(`<li class="warning">${holidayDates} holidays require at least ${holidaySeats} participants with a 24-hour holiday allowance each (one 24-hour duty or two 12-hour duties on separate dates). Current team with shift permissions: ${eligible}. Availability and day/night permissions may require more participants.</li>`);
  if (missing.length) lines.push(`<li>${missing.length} shift seats remain unfilled across ${new Set(missing.map(s => s.date)).size} dates. Open a date to review available people.</li>`);
  for (const date of monthDates(month)) if (coverageStatus(date, assignments).overstaffed)
    lines.push(`<li class="warning">${escape(date)} · Overstaffed / overlapping coverage. Open the date and remove overlapping or incompatible duties.</li>`);
  if (issues.length) lines.push(...issues.map(i => `<li class="warning">${escape(i.assignment.date)} · ${escape(personLabel(i.assignment.participantId))}: ${escape(i.message)}${i.assignment.override ? ' · confirmed manual exception' : ''}.</li>`));
  const hours = Object.values(totals(state, month)).map(t => t.hours);
  if (hours.length && Math.max(...hours) - Math.min(...hours) > 24) lines.push('<li class="warning">Workloads differ by more than 24 hours. Review availability or generate another proposal to improve balance.</li>');
  if (!state.months[shiftMonth(month, -1)] || !state.months[shiftMonth(month, 1)]) lines.push('<li>Rest checks include all saved adjacent months. Unsaved months have no known assignments.</li>');
  $('#issues').innerHTML = lines.length ? `<ul class="issue-list">${lines.join('')}</ul>` : '<p class="muted">All seats are covered. No scheduling conflicts found.</p>';
}
function changed() { save(); render(); if (openDate && $('#day-dialog').open) renderDay(); }
function otherAssignments(slot) { return allAssignments(state).filter(a => !(a.date === slot.date && a.kind === slot.kind && a.seat === slot.seat)); }
function showDay(date) { assignmentDrafts.clear(); openDate = date; renderDay(); $('#day-dialog').showModal(); }
function renderDay() {
  const config = state.months[month];
  $('#day-title').textContent = dateTitle(openDate);
  const weekend = [0, 6].includes(weekday(openDate));
  const info = holidayDetails(openDate, config);
  const official = info.local || info.general;
  const slots = slotsForDate(openDate, config).flatMap(s => holiday(openDate, config) && s.kind === '24' && splitChoices.has(`${openDate}/${s.seat}`) && !config.assignments.some(a => a.date === openDate && a.seat === s.seat) ? [{ ...s, kind: 'day' }, { ...s, kind: 'night' }] : [s]);
  const issues = audit(state, month);
  $('#day-content').innerHTML = `<label class="checkbox-label holiday-toggle"><input id="mark-holiday" type="checkbox" ${holiday(openDate, config) ? 'checked' : ''} ${weekend || official ? 'disabled' : ''}>${official ? escape(`${info.label} · ${info.name}`) : weekend ? 'Weekend · always a holiday' : 'Mark as an additional holiday'}</label><p class="dialog-note">${holiday(openDate, config) ? 'Holiday · any combination of 24-hour and separate 12-hour duties is allowed' : 'Non-holiday · 24-hour shifts'}. Two people are required at all times. Select a participant, then confirm to apply that assignment. Cancel or close to discard pending selections.</p>` + slots.map(s => {
    const a = config.assignments.find(a => slotKey(a) === slotKey(s));
    const pending = assignmentDrafts.has(slotKey(s));
    const selected = pending ? assignmentDrafts.get(slotKey(s)) : a?.participantId ?? '';
    const warnings = issues.filter(i => slotKey(i.assignment) === slotKey(s));
    return `<div class="assignment-editor"><div class="assignment-row"><label>${kindLabel(s.kind)} · Seat ${s.seat + 1}<select data-assign="${s.kind}/${s.seat}"><option value="" ${selected ? '' : 'selected'}>Unfilled</option>${state.participants.map(p => {
      const candidate = { ...s, participantId: p.id };
      const structural = structuralIssues(state, month, candidate, otherAssignments(s));
      const rules = ruleIssues(state, month, candidate, otherAssignments(s));
      return `<option value="${p.id}" ${p.id === selected ? 'selected' : ''} ${structural.length ? 'disabled' : ''}>${escape(personLabel(p.id))} (${participantCode(p)})${structural.length ? ' · already on this date' : rules.length ? ` · ${rules.length} restriction(s)` : ''}</option>`;
    }).join('')}</select></label></div><p class="assignment-pending muted" role="status">${pending ? 'Pending selection. Confirm to apply.' : 'Select a participant, then confirm.'}</p><div class="assignment-actions"><button type="button" class="primary" data-confirm-assign="${s.kind}/${s.seat}" ${pending ? '' : 'disabled'}>Confirm assignment</button><button type="button" data-cancel-assign="${s.kind}/${s.seat}" ${pending ? '' : 'disabled'}>Cancel selection</button></div><div class="assignment-meta"><span>${timeLabel(s.kind)}</span></div>${holiday(openDate, config) && s.kind !== 'night' ? `<button class="small" data-${s.kind === '24' ? 'split' : 'merge'}="${s.seat}">${s.kind === '24' ? 'Split into day and night shifts' : 'Use one 24-hour duty'}</button>` : ''}${warnings.length ? `<p class="assignment-warnings">${warnings.map(i => escape(i.message)).join(' · ')}${a?.override ? ' · confirmed manual exception' : ''}</p>` : ''}</div>`;
  }).join('') + config.assignments.filter(a => a.date === openDate && !slots.some(s => slotKey(s) === slotKey(a))).map(a => `<div class="assignment-editor stale-assignment"><p>Incompatible ${kindLabel(a.kind)} assignment: ${escape(personLabel(a.participantId))}. The date’s shift mode has changed.</p><button class="danger" data-stale="${a.kind}/${a.seat}">Remove incompatible assignment</button></div>`).join('');
}

function addParticipants(count) {
  for (let i = 0; i < count; i++) {
    const p = { id: crypto.randomUUID(), code: state.nextCode++, allowedKinds: ['24'], blockedWeekdays: [], blockedDates: [] };
    state.participants.push(p); selectedId = p.id;
  }
  changed();
}
$('#add-participant').addEventListener('click', () => {
  const count = Number($('#add-count').value);
  if (!Number.isInteger(count) || count < 1 || count > 100 || state.participants.length + count > 500) return notify('Add between 1 and 100 people at once, up to 500 total.', true);
  if (!discardParticipantDraft()) return;
  addParticipants(count);
});
$('#participants').addEventListener('click', event => {
  const button = event.target.closest('[data-person]');
  if (!button || worker || moving) return;
  if (!discardParticipantDraft()) return;
  selectedId = button.dataset.person; renderParticipants(); renderEditor();
  $('#participant-dialog').showModal();
  $('#person-name').focus({ preventScroll: true });
});
$('#participant-dialog').addEventListener('close', () => {
  if ($('#participant-dialog').open) return;
  participantDraft = null; participantDirty = false;
  if (setupPeople.length) {
    const finished = setupPersonIndex >= setupPeople.length;
    if (finished) { setupPeople = []; setupPersonIndex = 0; }
    renderEditor(); renderSetup(finished ? 'ready' : 'choice');
    $('#setup-dialog').showModal(); $('#setup-generate').focus(); return;
  }
  renderEditor();
  if ($('#setup-dialog').open) return;
  const selected = [...$('#participants').querySelectorAll('[data-person]')].find(button => button.dataset.person === selectedId);
  (selected ?? $('#add-participant')).focus({ preventScroll: true });
});
function updateParticipantDraft(event) {
  if (!participantDraft) return;
  const kind = event.target.dataset.kind;
  if (kind && event.target.checked) {
    for (const input of $('#participant-editor').querySelectorAll('[data-kind]')) {
      if ((kind === '24' && input.dataset.kind !== '24') || (kind !== '24' && input.dataset.kind === '24')) input.checked = false;
    }
  }
  participantDraft.name = $('#person-name').value;
  participantDraft.allowedKinds = [...$('#participant-editor').querySelectorAll('[data-kind]:checked')].map(el => el.dataset.kind);
  for (const input of $('#participant-editor').querySelectorAll('[data-kind]')) {
    input.disabled = input.dataset.kind === '24'
      ? participantDraft.allowedKinds.some(k => k !== '24')
      : participantDraft.allowedKinds.includes('24');
  }
  participantDraft.blockedWeekdays = [...$('#participant-editor').querySelectorAll('[data-weekday]:checked')].map(el => Number(el.dataset.weekday));
  participantDirty = true;
  $('#confirm-participant').disabled = false; $('#cancel-participant').disabled = false;
  $('#participant-edit-status').textContent = 'Unconfirmed changes. Confirm to apply them.';
}
$('#participant-editor').addEventListener('input', updateParticipantDraft);
$('#participant-editor').addEventListener('change', updateParticipantDraft);
$('#participant-editor').addEventListener('submit', event => {
  event.preventDefault();
  const p = state.participants.find(p => p.id === selectedId);
  if (!p || !participantDraft || (!participantDirty && !setupPeople.length) || worker) return;
  if (participantDraft.blockedDates.some(date => !monthDates(month).includes(date))) {
    $('#participant-edit-status').textContent = 'Choose dates within the displayed month. No participant changes were applied.';
    $('.blocked-date-grid button').focus(); return;
  }
  names.set(p.id, participantDraft.name);
  p.allowedKinds = exclusiveKinds(participantDraft.allowedKinds);
  p.blockedWeekdays = [...participantDraft.blockedWeekdays];
  p.blockedDates = [...p.blockedDates.filter(d => !d.startsWith(month)), ...new Set(participantDraft.blockedDates)].sort();
  participantDraft = null; participantDirty = false;
  changed();
  if (setupPeople.length) { advanceSetupPerson(); return; }
  $('#participant-dialog').close();
  notify('Participant changes confirmed. Names stay in this session.');
});
$('#participant-editor').addEventListener('click', event => {
  const dateButton = event.target.closest('[data-block-date]');
  if (dateButton && participantDraft) {
    const date = dateButton.dataset.blockDate;
    const dates = new Set(participantDraft.blockedDates);
    if (dates.has(date)) dates.delete(date); else dates.add(date);
    participantDraft.blockedDates = [...dates].sort();
    const selected = dates.has(date);
    dateButton.classList.toggle('selected', selected);
    dateButton.setAttribute('aria-pressed', String(selected));
    dateButton.setAttribute('aria-label', `${dateTitle(date)}, ${selected ? 'blocked' : 'not selected'}`);
    for (const button of $('#participant-editor').querySelectorAll('[data-block-date]')) button.tabIndex = button === dateButton ? 0 : -1;
    $('#blocked-date-count').textContent = `${dates.size} date${dates.size === 1 ? '' : 's'} selected`;
    updateParticipantDraft(event); return;
  }
  if (event.target.id === 'cancel-participant') {
    participantDraft = null; participantDirty = false;
    if (setupPeople.length) { advanceSetupPerson(); return; }
    renderEditor(); $('#participant-dialog').close(); return;
  }
  if (event.target.id !== 'remove-person') return;
  if (!confirm('Delete this participant and all their assignments in every saved month? This cannot be undone. Export an anonymous backup first if needed.')) return;
  state.participants = state.participants.filter(p => p.id !== selectedId);
  for (const config of Object.values(state.months)) config.assignments = config.assignments.filter(a => a.participantId !== selectedId);
  names.delete(selectedId); participantDraft = null; participantDirty = false; selectedId = state.participants[0]?.id ?? null; changed();
  $('#participant-dialog').close();
});
$('#participant-editor').addEventListener('keydown', event => {
  const current = event.target.closest('[data-block-date]');
  if (!current) return;
  const buttons = [...$('#participant-editor').querySelectorAll('[data-block-date]')];
  const index = buttons.indexOf(current), column = (weekday(current.dataset.blockDate) + 6) % 7;
  const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -column, End: 6 - column };
  if (!(event.key in steps)) return;
  event.preventDefault();
  const next = buttons[Math.max(0, Math.min(buttons.length - 1, index + steps[event.key]))];
  for (const button of buttons) button.tabIndex = button === next ? 0 : -1;
  next.focus();
});
function navigate(next) { if (moving || worker) return; if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(next) || Number(next.slice(0, 4)) < 1900 || Number(next.slice(0, 4)) > 2200) return notify('Choose a month between January 1900 and December 2200.', true); if (next === month) return; if (!discardParticipantDraft()) { $('#month-input').value = month; return; } month = next; ensureMonth(); save(); render(); }
$('#participant-view').addEventListener('change', event => {
  if (worker || moving) return;
  calendarParticipantId = event.target.value || null; renderCalendar();
});
$('#previous').addEventListener('click', () => navigate(shiftMonth(month, -1)));
$('#next').addEventListener('click', () => navigate(shiftMonth(month, 1)));
$('#today').addEventListener('click', () => navigate(todayMonth()));
$('#month-input').addEventListener('change', event => navigate(event.target.value));
$('#city-options').innerHTML = CITIES.map(city => `<option value="${escape(city.label)}"></option>`).join('');
$('#apply-city').addEventListener('click', () => {
  const city = findCity($('#city-input').value);
  if (!city) {
    $('#city-input').setAttribute('aria-invalid', 'true');
    return notify('Choose a city or settlement from the list. No matching official municipal record was found; the previous city was kept.', true);
  }
  $('#city-input').removeAttribute('aria-invalid'); setCity(city);
});
$('#city-input').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); $('#apply-city').click(); } });
$('#clear-city').addEventListener('click', () => setCity(null));
function readSlot(key) { const [date, kind, seat] = key.split('/'); return { date, kind, seat: Number(seat) }; }
function focusEntry(key) {
  const entry = [...document.querySelectorAll('[data-move]')].find(el => el.dataset.move === key);
  (entry ?? $('#calendar')).focus({ preventScroll: true });
}
function showAssignmentOptions(key) {
  if (worker || moving) return;
  const assignment = state.months[month].assignments.find(a => slotKey(a) === key);
  if (!assignment) return;
  selectedAssignmentKey = key;
  $('#assignment-context').textContent = `${personLabel(assignment.participantId)} · ${dateTitle(assignment.date)} · ${kindLabel(assignment.kind)} · Place ${assignment.seat + 1}`;
  $('#assignment-dialog').showModal();
  $('#choose-move').focus({ preventScroll: true });
}
$('#assignment-dialog').addEventListener('close', () => {
  if ($('#assignment-dialog').open) return; // Ignore a delayed close event after reopening.
  const key = selectedAssignmentKey;
  selectedAssignmentKey = null;
  $('#assignment-context').textContent = '';
  // Moving sets its own destination focus; otherwise return to the origin.
  if (moving) return;
  const entry = [...document.querySelectorAll('[data-move]')].find(el => el.dataset.move === key);
  const day = [...document.querySelectorAll('.day-cell')].find(el => el.dataset.date === key?.split('/')[0]);
  (entry ?? day?.querySelector('.date-open') ?? $('#calendar')).focus({ preventScroll: true });
});
$('#choose-move').addEventListener('click', () => {
  const key = selectedAssignmentKey;
  $('#assignment-dialog').close();
  if (key) beginMove(key, true);
});
$('#cancel-assignment').addEventListener('click', () => {
  if (!selectedAssignmentKey || worker || moving) return;
  const config = state.months[month];
  if (!config.assignments.some(a => slotKey(a) === selectedAssignmentKey)) return;
  config.assignments = config.assignments.filter(a => slotKey(a) !== selectedAssignmentKey);
  $('#assignment-dialog').close();
  changed();
  notify('Assignment cancelled. The spot is now unfilled.');
});
function beginMove(key, keyboard = false) {
  if (worker || moving) return false;
  const source = state.months[month].assignments.find(a => slotKey(a) === key);
  if (!source) return false;
  moving = { key, kind: source.kind };
  renderCalendar();
  if (keyboard) ($('#month-grid [data-drop]') ?? $('#cancel-move')).focus({ preventScroll: true });
  return true;
}
function clearPointer() {
  if (pointer) { clearTimeout(pointer.timer); cancelAnimationFrame(pointer.frame); }
  pointer = null;
  $('#move-cursor').hidden = true;
  document.querySelector('.drop-hover')?.classList.remove('drop-hover');
}
function cancelMove(message = 'Move cancelled. Original assignment kept.') {
  const key = moving?.key;
  clearPointer();
  if (!moving) return;
  moving = null; renderCalendar();
  notify(message); focusEntry(key);
}
function completeMove(key) {
  if (!moving || worker) return;
  const original = moving.key;
  try {
    const assignments = movedAssignments(state, month, original, readSlot(key));
    clearPointer(); moving = null;
    state.months[month].assignments = assignments;
    changed(); notify('Assignment moved.'); focusEntry(key);
  } catch (error) { cancelMove(`Move rejected: ${error.message} Original assignment kept.`); }
}
$('#cancel-move').addEventListener('click', () => cancelMove());
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && (moving || pointer)) { event.preventDefault(); cancelMove(); }
});
$('#month-grid').addEventListener('click', event => {
  if (performance.now() < suppressClickUntil || worker) return;
  const target = event.target.closest('[data-drop]');
  if (target && moving) return completeMove(target.dataset.drop);
  if (moving) return;
  const entry = event.target.closest('[data-move]');
  if (entry) return showAssignmentOptions(entry.dataset.move);
  const day = event.target.closest('[data-date]');
  if (day) showDay(day.dataset.date);
});

// Pointer state contains anonymous assignment keys only, never participant names.
function updateDrag() {
  if (!pointer?.active) return;
  const { x, y } = pointer;
  const scroller = $('.calendar-scroll'), rect = scroller.getBoundingClientRect();
  if (x < rect.left + 30) scroller.scrollLeft -= 12;
  if (x > rect.right - 30) scroller.scrollLeft += 12;
  if (y < 55) window.scrollBy(0, -14);
  if (y > window.innerHeight - 55) window.scrollBy(0, 14);
  $('#move-cursor').style.transform = `translate(${x + 14}px, ${y + 14}px)`;
  document.querySelector('.drop-hover')?.classList.remove('drop-hover');
  document.elementFromPoint(x, y)?.closest('[data-drop]')?.classList.add('drop-hover');
  pointer.frame = requestAnimationFrame(updateDrag);
}
function activatePointer() {
  if (!pointer || pointer.scrolling || !beginMove(pointer.key)) return;
  pointer.active = true;
  // Release touch's implicit capture before replacing/targeting individual spots.
  $('#move-cursor').textContent = `${shortKind(moving.kind)} · moving duty`;
  $('#move-cursor').hidden = false;
  updateDrag();
}
$('#month-grid').addEventListener('pointerdown', event => {
  const entry = event.target.closest('[data-move]');
  if (!entry || worker || moving || !event.isPrimary || event.button !== 0) return;
  clearPointer();
  pointer = { id: event.pointerId, key: entry.dataset.move, x: event.clientX, y: event.clientY,
    startX: event.clientX, startY: event.clientY, touch: event.pointerType === 'touch', active: false, scrolling: false };
  if (entry.hasPointerCapture(event.pointerId)) entry.releasePointerCapture(event.pointerId);
  if (pointer.touch) pointer.timer = setTimeout(activatePointer, 300);
});
$('#month-grid').addEventListener('contextmenu', event => {
  if (event.target.closest('[data-move]') || pointer?.active) event.preventDefault();
});
document.addEventListener('pointermove', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
  pointer.x = event.clientX; pointer.y = event.clientY;
  const distance = Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY);
  if (!pointer.active && distance > 6) {
    if (pointer.touch) { clearTimeout(pointer.timer); pointer.scrolling = true; }
    else activatePointer();
  }
  if (pointer?.scrolling) {
    // A swipe before the hold scrolls instead of picking up a duty.
    $('.calendar-scroll').scrollLeft -= dx;
    window.scrollBy(0, -dy);
  }
  if (pointer?.active && event.cancelable) event.preventDefault();
}, { passive: false });
document.addEventListener('pointerup', event => {
  if (!pointer || pointer.id !== event.pointerId) return;
  const { active, scrolling } = pointer;
  if (active || scrolling) suppressClickUntil = performance.now() + 450;
  if (!active) { clearPointer(); return; }
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-drop]');
  if (target) completeMove(target.dataset.drop);
  else cancelMove('No valid spot selected. Original assignment kept.');
});
document.addEventListener('pointercancel', () => { if (pointer?.active) cancelMove(); else clearPointer(); });
window.addEventListener('blur', () => { if (pointer?.active) cancelMove(); else clearPointer(); });
$('#day-dialog').addEventListener('close', () => { openDate = null; assignmentDrafts.clear(); });
$('#day-content').addEventListener('change', event => {
  const config = state.months[month];
  if (event.target.id === 'mark-holiday') {
    assignmentDrafts.clear();
    config.holidays = event.target.checked ? [...new Set([...config.holidays, openDate])] : config.holidays.filter(d => d !== openDate);
    changed(); return;
  }
  if (!event.target.dataset.assign) return;
  const [kind, seatString] = event.target.dataset.assign.split('/');
  const slot = { date: openDate, kind, seat: Number(seatString) };
  assignmentDrafts.set(slotKey(slot), event.target.value);
  const editor = event.target.closest('.assignment-editor');
  editor.querySelector('[data-confirm-assign]').disabled = false;
  editor.querySelector('[data-cancel-assign]').disabled = false;
  editor.querySelector('.assignment-pending').textContent = 'Pending selection. Confirm to apply.';
});
$('#day-content').addEventListener('click', event => {
  const confirmButton = event.target.closest('[data-confirm-assign]');
  const cancelButton = event.target.closest('[data-cancel-assign]');
  if (!confirmButton && !cancelButton) return;
  const value = confirmButton?.dataset.confirmAssign ?? cancelButton.dataset.cancelAssign;
  const [kind, seatString] = value.split('/');
  const slot = { date: openDate, kind, seat: Number(seatString) };
  const key = slotKey(slot), config = state.months[month];
  const focusSelection = () => $(`#day-content [data-assign="${value}"]`)?.focus({ preventScroll: true });
  if (cancelButton) { assignmentDrafts.delete(key); renderDay(); focusSelection(); return; }
  if (!assignmentDrafts.has(key)) return;
  const participantId = assignmentDrafts.get(key);
  const status = confirmButton.closest('.assignment-editor').querySelector('.assignment-pending');
  if (!participantId) { assignmentDrafts.delete(key); config.assignments = config.assignments.filter(a => slotKey(a) !== key); changed(); focusSelection(); return; }
  const candidate = { ...slot, participantId, fixed: false, override: false };
  const others = otherAssignments(slot);
  const structural = structuralIssues(state, month, candidate, others);
  if (structural.length) { status.textContent = `Not applied: ${structural.join('. ')}.`; return; }
  const issues = ruleIssues(state, month, candidate, others);
  if (issues.length && !confirm(`This assignment breaks scheduling rules:\n\n${issues.join('\n')}\n\nKeep it as an explicit manual exception?`)) { status.textContent = 'Exception declined. Change or cancel this pending selection.'; return; }
  candidate.override = issues.length > 0;
  assignmentDrafts.delete(key);
  config.assignments = [...config.assignments.filter(a => slotKey(a) !== slotKey(slot)), candidate]; changed();
  focusSelection();
});
$('#day-content').addEventListener('click', event => {
  const split = event.target.closest('[data-split]'), merge = event.target.closest('[data-merge]');
  if (split || merge) {
    const seat = Number(split?.dataset.split ?? merge.dataset.merge);
    const config = state.months[month];
    const assigned = config.assignments.filter(a => a.date === openDate && a.seat === seat);
    if (assigned.length && !confirm('Replace the assignments for this place? Existing duties on this date and place will be cleared.')) return;
    assignmentDrafts.clear();
    config.assignments = config.assignments.filter(a => a.date !== openDate || a.seat !== seat);
    const key = `${openDate}/${seat}`;
    if (split) splitChoices.add(key); else splitChoices.delete(key);
    changed(); return;
  }
  const staleButton = event.target.closest('[data-stale]');
  const value = staleButton?.dataset.stale;
  if (!value) return;
  const [kind, seat] = value.split('/');
  const config = state.months[month];
  const a = config.assignments.find(a => a.date === openDate && a.kind === kind && a.seat === Number(seat));
  if (!a) return;
  config.assignments = config.assignments.filter(other => other !== a);
  changed();
});

function busy(on) {
  for (const el of document.querySelectorAll('.app-shell button, .app-shell input, .app-shell select')) {
    if (el.id !== 'cancel' && el.id !== 'restart') el.disabled = on;
  }
  $('#cancel').hidden = !on;
  $('#generate').textContent = on ? 'Searching…' : 'Generate month';
}
function finishSearch(stopped = false) {
  worker?.terminate(); worker = null;
  if (latestProposal) state.months[month].assignments = latestProposal.assignments;
  busy(false); changed();
  $('#search-status').textContent = `${stopped ? 'Search stopped.' : 'Search finished.'} ${latestProposal?.complete ? 'All seats covered.' : 'Best proposal kept; unfilled seats remain.'} Review workload and restrictions. A time-limited search does not prove that a better proposal is impossible.`;
  if (setupReviewPending) {
    setupReviewPending = false;
    notify('Next: review the highlighted dates. Select a participant to edit their name, shift preferences, or availability. Generate month again after making changes.');
  }
}
function startSearch() {
  if (moving || worker) return;
  if (participantDirty) { notify('Confirm or cancel participant changes before generating.', true); $('#confirm-participant').focus(); return; }
  if (!state.participants.length) return notify('Add participants before generating a month.', true);
  latestProposal = null;
  try {
    worker = new Worker(new URL('./scheduler.worker.mjs', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      if (data.type === 'error') { worker.terminate(); worker = null; busy(false); notify(data.message, true); $('#search-status').hidden = true; return; }
      latestProposal = data;
      const coveredHours = data.assignments.reduce((sum, a) => sum + HOURS[a.kind], 0);
      $('#search-status').textContent = `Searching for up to 10 seconds… Best coverage: ${coveredHours}/${monthDates(month).length * 48} hours. Yellow dates need coverage. You can stop and keep this proposal.`;
      renderCalendar(data.assignments);
      if (data.type === 'done') finishSearch();
    };
    worker.onerror = () => { worker?.terminate(); worker = null; busy(false); $('#search-status').hidden = true; notify('Search could not run. Serve this folder over HTTP and try again. Existing assignments were kept.', true); };
    busy(true); $('#search-status').hidden = false; $('#search-status').textContent = 'Starting anonymous scheduling search…';
    worker.postMessage({ state: anonymousState(state), month, timeMs: 10000 });
  } catch {
    worker?.terminate(); worker = null; busy(false);
    notify('Your browser could not start the scheduling worker. Serve this folder over HTTP and use a current browser.', true);
  }
}
$('#generate').addEventListener('click', startSearch);
$('#cancel').addEventListener('click', () => finishSearch(true));
$('#restart').addEventListener('click', () => {
  if (!confirm('Restart the planner? This deletes all participants, assignments, restrictions, added holidays, and the selected city for every saved month in this browser. Export a backup first if you want to keep them. This cannot be undone.')) return;
  try { localStorage.removeItem(STORAGE_KEY); }
  catch { notify('Saved planner data could not be cleared. Nothing was reset. Please try again.', true); return; }
  if (worker) { worker.onmessage = null; worker.onerror = null; worker.terminate(); worker = null; }
  clearPointer(); moving = null; suppressClickUntil = 0; latestProposal = null;
  state = emptyState(); calendarParticipantId = null; month = todayMonth(); selectedId = null; openDate = null;
  names.clear(); splitChoices.clear(); assignmentDrafts.clear();
  participantDraft = null; participantDirty = false; selectedAssignmentKey = null;
  storageBlocked = false; saveFailed = false; migratedShiftPermissions = false;
  setupPeople = []; setupCreatedIds = []; setupPersonIndex = 0; setupCount = 0;
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  $('#assignment-context').textContent = '';
  $('#participant-title').textContent = 'Participant settings';
  $('#day-content').replaceChildren(); $('#day-title').textContent = '';
  $('#move-cursor').textContent = '';
  $('#print-report').replaceChildren(); $('#print-report').setAttribute('aria-hidden', 'true');
  $('#import-file').value = ''; $('#city-input').removeAttribute('aria-invalid');
  $('#search-status').textContent = ''; $('#search-status').hidden = true;
  $('.city-source').open = false;
  $('#participant-panel').open = !window.matchMedia('(max-width: 800px)').matches;
  busy(false); render();
  $('#save-status').textContent = 'Anonymous data only';
  notify('Planner restarted. All saved planning data has been cleared.');
  window.scrollTo(0, 0);
  ($('#participant-panel').open ? $('#add-count') : $('#participant-panel summary')).focus({ preventScroll: true });
  setupReviewPending = false; checkSetup();
});
$('#backup').addEventListener('click', () => {
  const blob = new Blob([serialize(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'duty-calendar-anonymous-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Anonymous backup exported. Names are intentionally excluded.');
});
$('#restore').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 5_000_000) throw new Error('Backup is too large. Choose a JSON backup smaller than 5 MB.');
    const restored = parseBackup(await file.text());
    if (!confirm('Replace all saved participants, restrictions, and months with this anonymous backup? Current session names will also be cleared.')) return;
    state = restored; calendarParticipantId = null; names.clear(); splitChoices.clear(); participantDraft = null; participantDirty = false; selectedId = state.participants[0]?.id ?? null;
    storageBlocked = false; setupPeople = []; setupCreatedIds = []; setupPersonIndex = 0; setupCount = 0;
    for (const dialog of document.querySelectorAll('dialog[open]')) if (dialog.id !== 'setup-dialog') dialog.close();
    assignmentDrafts.clear(); selectedAssignmentKey = null;
    changed(); checkSetup();
    notify('Anonymous backup restored. Re-enter participant names for this session. Any mixed shift permissions default to 24 hours; existing assignments are kept.');
  } catch (error) { notify(error.message, true); }
  finally { event.target.value = ''; }
});

function renderSetup(step) {
  setupStep = step;
  const team = step === 'team', choice = step === 'choice' || step === 'ready';
  $('#setup-progress').textContent = storageBlocked ? 'Recover your planner' : choice ? 'Choose your next step' : state.participants.length ? 'Finish setup - your team is already saved' : `Step ${team ? 2 : 1} of 2`;
  $('#setup-title').textContent = storageBlocked ? 'Your saved planner needs attention' : step === 'ready' ? 'Your participants are ready' : choice ? 'What would you like to do?' : team ? 'Add your participants' : 'Choose your city';
  $('#setup-description').textContent = storageBlocked ? 'Recover access without overwriting unreadable saved data.' : choice ? 'Fill participant information first, or generate the calendar now.' : team ? 'Enter your team size. Next, choose how to continue.' : state.participants.length ? 'Choose a city to finish setup. Your existing participants and assignments will be kept.' : 'Start with your city so local and public holidays are included.';
  $('#setup-form').hidden = storageBlocked;
  $('#setup-recovery').hidden = !storageBlocked;
  $('#setup-restart').hidden = !storageBlocked;
  $('#setup-city-step').hidden = team || choice;
  $('#setup-team-step').hidden = !team;
  $('#setup-choice-step').hidden = !choice;
  $('#setup-choice-description').textContent = `${setupCreatedIds.length || setupCount} participants. ${step === 'ready' ? 'Confirmed settings will be used for generation.' : 'You can enter names, shift preferences, and availability one participant at a time. Names are optional.'}`;
  $('#setup-edit-people').textContent = setupPeople.length ? 'Continue participant information' : step === 'ready' ? 'Review participant information' : 'Fill participant information';
  $('#setup-back').hidden = !team && !(choice && !setupCreatedIds.length);
  $('#setup-next').hidden = choice;
  $('#setup-next').textContent = team ? 'Continue' : state.participants.length ? 'Confirm city and open planner' : 'Confirm city';
  $('#setup-month').textContent = `Planning ${monthTitle(month)}. You can review information before generating.`;
  $('#setup-error').textContent = saveFailed ? 'Saving is unavailable. You can continue in this session; export a backup before leaving.' : '';
  $('#setup-error').hidden = !saveFailed;
  const city = cityById(state.cityId);
  $('#setup-data-warning').hidden = !city || cityYearAvailable(city.id, month.slice(0, 4));
  $('#setup-data-warning').textContent = `Official holiday dates for ${month.slice(0, 4)} are unavailable. You can continue and mark holidays manually in the planner.`;
  $('#setup-city').removeAttribute('aria-invalid'); $('#setup-count').removeAttribute('aria-invalid');
  if (!team && !choice) $('#setup-city').value = cityById(state.cityId)?.label ?? '';
}
function closeSetup() {
  setupStep = null; $('#setup-dialog').close();
  $('#generate').focus({ preventScroll: true });
}
function checkSetup() {
  setupPeople = []; setupCreatedIds = []; setupPersonIndex = 0; setupCount = 0;
  if (!storageBlocked && cityById(state.cityId) && state.participants.length) {
    if ($('#setup-dialog').open) closeSetup();
    return;
  }
  for (const dialog of document.querySelectorAll('dialog[open]')) if (dialog.id !== 'setup-dialog') dialog.close();
  participantDraft = null; participantDirty = false;
  $('#setup-count').value = '1';
  renderSetup(!storageBlocked && cityById(state.cityId) ? 'team' : 'city');
  if (!$('#setup-dialog').open) $('#setup-dialog').showModal();
  (storageBlocked ? $('#setup-import') : $(setupStep === 'team' ? '#setup-count' : '#setup-city')).focus();
}
$('#setup-dialog').addEventListener('cancel', event => event.preventDefault());
document.addEventListener('keydown', event => {
  if (!$('#setup-dialog').open || event.key !== 'Tab') return;
  const controls = [...$('#setup-dialog').querySelectorAll('button, input, select, a[href]')].filter(el => !el.disabled && el.getClientRects().length);
  const first = controls[0], last = controls.at(-1), active = document.activeElement;
  if (!controls.includes(active) || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
    event.preventDefault(); (event.shiftKey ? last : first)?.focus();
  }
});
$('#setup-back').addEventListener('click', () => {
  const fromChoice = setupStep === 'choice';
  renderSetup(fromChoice ? 'team' : 'city'); $(fromChoice ? '#setup-count' : '#setup-city').focus();
});
$('#setup-import').addEventListener('click', () => $('#import-file').click());
$('#setup-restart').addEventListener('click', () => $('#restart').click());
function createSetupTeam() {
  if (setupCreatedIds.length) return;
  const before = state.participants.length;
  addParticipants(setupCount);
  setupCreatedIds = state.participants.slice(before).map(p => p.id);
}
function openSetupPerson() {
  selectedId = setupPeople[setupPersonIndex]; participantDraft = null; participantDirty = false;
  renderParticipants(); renderEditor();
  if (!$('#participant-dialog').open) $('#participant-dialog').showModal();
  $('#person-name').focus({ preventScroll: true });
}
function advanceSetupPerson() {
  setupPersonIndex++; participantDraft = null; participantDirty = false;
  if (setupPersonIndex < setupPeople.length) openSetupPerson();
  else $('#participant-dialog').close();
}
$('#setup-edit-people').addEventListener('click', () => {
  if (!['choice', 'ready'].includes(setupStep) || setupSubmitting) return;
  setupSubmitting = true;
  try {
    createSetupTeam();
    if (!setupPeople.length) { setupPeople = [...setupCreatedIds]; setupPersonIndex = 0; }
    closeSetup(); openSetupPerson();
  } finally { setupSubmitting = false; }
});
$('#setup-generate').addEventListener('click', () => {
  if (!['choice', 'ready'].includes(setupStep) || setupSubmitting) return;
  setupSubmitting = true;
  try {
    createSetupTeam(); setupPeople = []; setupPersonIndex = 0;
    closeSetup(); setupReviewPending = true; startSearch();
    $('#cancel').focus({ preventScroll: true });
  } finally { setupSubmitting = false; }
});
$('#setup-form').addEventListener('submit', event => {
  event.preventDefault();
  if (setupSubmitting || storageBlocked || !setupStep) return;
  if (setupStep === 'city') {
    const city = findCity($('#setup-city').value);
    if (!city) {
      $('#setup-city').setAttribute('aria-invalid', 'true');
      notify('Choose a recognised city from the list before continuing.', true); $('#setup-city').focus(); return;
    }
    setCity(city);
    if (state.participants.length) { closeSetup(); return; }
    renderSetup('team'); $('#setup-count').focus(); return;
  }
  if (!cityById(state.cityId)) { renderSetup('city'); $('#setup-city').focus(); return; }
  if (setupStep === 'choice' || setupStep === 'ready') return;
  const count = Number($('#setup-count').value);
  if (!Number.isInteger(count) || count < 1 || count > 100 || state.participants.length + count > 500) {
    $('#setup-count').setAttribute('aria-invalid', 'true');
    notify('Enter a whole number from 1 to 100 participants, up to 500 total.', true); $('#setup-count').focus(); return;
  }
  setupCount = count;
  renderSetup('choice'); $('#setup-edit-people').focus();
});

function printCalendar(participantId = null) {
  const config = state.months[month], dates = monthDates(month), offset = (weekday(dates[0]) + 6) % 7;
  const cells = Array.from({ length: offset }, () => '<div class="print-day empty"></div>');
  const issueKeys = new Set(audit(state, month).map(i => slotKey(i.assignment)));
  for (const date of dates) {
    const info = holidayDetails(date, config), slots = slotsForDate(date, config);
    const assigned = config.assignments.filter(a => a.date === date);
    const own = assigned.filter(a => !participantId || a.participantId === participantId);
    const stale = own.filter(a => !slots.some(s => slotKey(s) === slotKey(a)));
    const relevant = participantId ? own : [...slots, ...stale];
    const lines = relevant.map(s => {
      const a = participantId || stale.includes(s) ? s : assigned.find(a => slotKey(a) === slotKey(s));
      return `<div class="print-shift ${a ? '' : 'pending'} ${a && issueKeys.has(slotKey(a)) ? 'conflict' : ''}"><span class="print-kind">${shortKind(s.kind)}</span><span class="print-name">${a ? escape(personLabel(a.participantId)) : 'Unfilled'}</span>${a?.override ? '<span class="print-exception">!</span>' : ''}</div>`;
    }).join('');
    const { missing, overstaffed } = coverageStatus(date, assigned);
    const status = participantId ? own.length ? 'On duty' : 'No duty' : missing ? 'Needs cover' : 'Covered';
    const colour = participantId ? `participant-day ${own.length ? 'participant-workday' : ''}` : overstaffed ? 'overstaffed' : missing ? 'unfilled' : 'covered';
    const badge = info.label && info.label !== 'Weekend' ? `<span class="print-holiday">${escape(info.label)}</span>` : '';
    cells.push(`<div class="print-day ${info.weekend ? 'weekend' : ''} ${info.local ? 'local-holiday' : ''} ${info.general ? 'public-holiday' : ''} ${colour} ${relevant.length >= 4 ? 'busy-day' : ''}" data-print-date="${date}"><div class="print-date"><strong>${Number(date.slice(-2))}</strong><span>${status}</span></div>${badge}${!participantId && overstaffed ? '<div class="print-coverage-warning">Overstaffed / overlapping coverage</div>' : ''}${!participantId && overstaffed && missing ? '<div class="print-coverage-warning">Missing coverage</div>' : ''}${lines}</div>`);
  }
  while (cells.length % 7) cells.push('<div class="print-day empty"></div>');
  return `<div class="print-weekdays"><span class="print-weekend-heading">Weekend</span>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => `<span class="print-weekday-name ${i >= 5 ? 'weekend' : ''}">${d}</span>`).join('')}</div><div class="print-calendar">${cells.join('')}</div>`;
}
function buildPrintReport() {
  const participantId = state.participants.some(p => p.id === calendarParticipantId) ? calendarParticipantId : null;
  const city = cityById(state.cityId), location = city ? `${city.name}, Catalonia` : 'No city selected';
  const issues = audit(state, month).filter(i => !participantId || i.assignment.participantId === participantId);
  const dataWarning = city && !cityYearAvailable(city.id, month.slice(0, 4)) ? ' Official holidays unavailable for this year; verify manual dates.' : '';
  const heading = participantId ? personLabel(participantId) : 'All participants';
  const legend = participantId ? '<span class="print-key on-duty">On duty</span><span class="print-key no-duty">No duty</span>' : '<span class="print-key covered">Covered</span><span class="print-key unfilled">Needs cover</span><span class="print-key overstaffed">Overstaffed / overlapping coverage</span>';
  $('#print-report').innerHTML = `<section class="print-page"><header class="print-header"><div><h1>Duty calendar</h1><p>${escape(location)} | ${escape(heading)}</p></div><h2>${escape(monthTitle(month))}</h2></header><div class="print-legend">${legend}</div>${printCalendar(participantId)}<footer class="print-footer"><span>24h 09:00-09:00 next day | Day 09:00-21:00 | Night 21:00-09:00 next day | Europe/Madrid</span><span>${issues.length} rule warning(s).${issues.length ? ' Flagged duties need review in the planner.' : ''}${escape(dataWarning)}</span></footer></section>`;
  $('#print-report').removeAttribute('aria-hidden');
}
$('#print').addEventListener('click', () => window.print());
window.addEventListener('beforeprint', buildPrintReport);
window.addEventListener('afterprint', () => { $('#print-report').replaceChildren(); $('#print-report').setAttribute('aria-hidden', 'true'); });
ensureMonth(); selectedId = state.participants[0]?.id ?? null; render();
if (storageBlocked) $('#save-status').textContent = 'Not saved · storage read failed';
else $('#save-status').textContent = 'Anonymous data only';
if (migratedShiftPermissions) save();
if (window.matchMedia('(max-width: 800px)').matches) $('#participant-panel').open = false;

checkSetup();
