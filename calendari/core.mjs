import { cityById, isOfficialHoliday } from './holidays.mjs';
export const STORAGE_KEY = 'calendari.anonymous.v1';
export const KINDS = ['24', 'day', 'night'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const HOURS = { '24': 24, day: 12, night: 12 };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const pad = n => String(n).padStart(2, '0');
export function todayMonth() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
export function emptyState() { return { version: 1, nextCode: 1, participants: [], months: {} }; }
export function newMonth() { return { holidays: [], assignments: [] }; }
export function monthDates(month) {
  const [y, m] = month.split('-').map(Number);
  return Array.from({ length: new Date(Date.UTC(y, m, 0)).getUTCDate() }, (_, i) => `${month}-${pad(i + 1)}`);
}
export function weekday(date) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
export function shiftDate(date, n) { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function shiftMonth(month, n) { const [y, m] = month.split('-').map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); }
export function holiday(date, config) { return [0, 6].includes(weekday(date)) || config.holidays.includes(date) || isOfficialHoliday(config.cityId, date); }
export function slotsForDate(date, config) {
  return [0, 1].flatMap(seat => {
    const split = holiday(date, config) && (config.assignments ?? []).some(a => a.date === date && a.seat === seat && a.kind !== '24');
    return (split ? ['day', 'night'] : ['24']).map(kind => ({ date, kind, seat }));
  });
}
export const slotKey = s => `${s.date}/${s.kind}/${s.seat}`;
export function slotsForMonth(month, config) { return monthDates(month).flatMap(d => slotsForDate(d, config)); }
export function allAssignments(state) { return Object.values(state.months).flatMap(m => m.assignments); }
export function participantCode(p) { return `P${String(p.code).padStart(3, '0')}`; }
export function totals(state, month, assignments = state.months[month]?.assignments ?? []) {
  const config = state.months[month] ?? newMonth();
  const result = Object.fromEntries(state.participants.map(p => [p.id, { hours: 0, holidays: 0, ordinary: 0, weekends: 0 }]));
  for (const a of assignments) {
    const t = result[a.participantId];
    if (!t) continue;
    t.hours += HOURS[a.kind];
    t[holiday(a.date, config) ? 'holidays' : 'ordinary']++;
    if ([0, 6].includes(weekday(a.date))) t.weekends++;
  }
  return result;
}
export function ruleIssues(state, month, assignment, others) {
  const p = state.participants.find(p => p.id === assignment.participantId);
  if (!p) return ['Participant no longer exists'];
  const config = state.months[month] ?? newMonth();
  const issues = [];
  if (!p.allowedKinds.includes(assignment.kind)) issues.push('Shift type is not allowed');
  if (p.blockedWeekdays.includes(weekday(assignment.date))) issues.push('Weekday is blocked');
  if (p.blockedDates.includes(assignment.date)) issues.push('Date is blocked');
  const own = others.filter(a => a.participantId === p.id);
  if (own.some(a => a.date === shiftDate(assignment.date, -1) || a.date === shiftDate(assignment.date, 1))) issues.push('Consecutive work dates');
  const isHoliday = holiday(assignment.date, config);
  const count = own.filter(a => a.date.startsWith(month) && holiday(a.date, config) === isHoliday).length;
  if (count >= (isHoliday ? 1 : 3)) issues.push(isHoliday ? 'Monthly holiday limit exceeded' : 'Monthly non-holiday limit exceeded');
  return issues;
}
export function structuralIssues(state, month, assignment, others) {
  const config = state.months[month] ?? newMonth();
  const issues = [];
  if (!KINDS.includes(assignment.kind) || ![0, 1].includes(assignment.seat)) issues.push('Invalid shift structure');
  if (assignment.kind !== '24' && !holiday(assignment.date, config)) issues.push('Non-holidays require 24-hour duties');
  if (others.some(a => a.date === assignment.date && a.seat === assignment.seat && (a.kind === assignment.kind || a.kind === '24' || assignment.kind === '24'))) issues.push('Seat already occupied');
  if (others.some(a => a.participantId === assignment.participantId && a.date === assignment.date)) issues.push('A person cannot work two shifts on one date');
  return issues;
}
export function audit(state, month) {
  const assignments = state.months[month]?.assignments ?? [];
  const outside = allAssignments(state).filter(a => !a.date.startsWith(month));
  return assignments.flatMap((a, i) => {
    const others = [...outside, ...assignments.filter((_, j) => j !== i)];
    return [...structuralIssues(state, month, a, others), ...ruleIssues(state, month, a, others)].map(message => ({ assignment: a, message }));
  });
}

// Count each nominal half-day independently: four separate short duties are valid.
export function coverageStatus(date, assignments) {
  const duties = assignments.filter(a => a.date === date);
  const periods = ['day', 'night'].map(kind => [0, 1].map(seat =>
    duties.filter(a => a.seat === seat && (a.kind === '24' || a.kind === kind)).length));
  return {
    missing: periods.some(seats => seats.some(count => count === 0)),
    overstaffed: periods.some(seats => seats.some(count => count > 1) || seats.reduce((a, b) => a + b, 0) > 2)
  };
}

// Return a new assignment list; callers commit it only after every check passes.
export function movedAssignments(state, month, sourceKey, target) {
  const config = state.months[month];
  const source = config?.assignments.find(a => slotKey(a) === sourceKey);
  if (!source) throw new Error('The original assignment no longer exists.');
  if (!target || !monthDates(month).includes(target.date) || target.date === source.date)
    throw new Error('Choose another date in this month.');
  if (target.kind !== source.kind) throw new Error('Keep the original shift type.');
  const candidate = { date: target.date, kind: target.kind, seat: target.seat, participantId: source.participantId, fixed: true, override: false };
  const others = allAssignments(state).filter(a => a !== source);
  const issues = [...structuralIssues(state, month, candidate, others), ...ruleIssues(state, month, candidate, others)];
  if (issues.length) throw new Error([...new Set(issues)].join('. '));
  return [...config.assignments.filter(a => a !== source), candidate];
}

export function moveTargets(state, month, sourceKey) {
  const source = state.months[month]?.assignments.find(a => slotKey(a) === sourceKey);
  if (!source) return [];
  return monthDates(month).flatMap(date => [0, 1].flatMap(seat => {
    const target = { date, kind: source.kind, seat };
    try { movedAssignments(state, month, sourceKey, target); return [target]; }
    catch { return []; }
  }));
}

// Every persisted field is explicitly selected and validated. Names never enter this model.
export function anonymousState(input) {
  const fail = () => { throw new Error('Backup format is invalid or unsupported. Existing data was kept.'); };
  const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
  const dateOK = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10) === d;
  const monthOK = m => /^\d{4}-(0[1-9]|1[0-2])$/.test(m) && Number(m.slice(0, 4)) >= 1900 && Number(m.slice(0, 4)) <= 2200;
  if (!input || input.version !== 1 || !Array.isArray(input.participants) || input.participants.length > 500 || !input.months || typeof input.months !== 'object' || Array.isArray(input.months)) fail();
  const ids = new Set(), codes = new Set();
  const participants = input.participants.map(p => {
    if (!p || !UUID.test(p.id) || ids.has(p.id) || !integer(p.code, 1, 1000000) || codes.has(p.code) || !Array.isArray(p.allowedKinds) || p.allowedKinds.some(k => !KINDS.includes(k)) || !Array.isArray(p.blockedWeekdays) || p.blockedWeekdays.some(d => !integer(d, 0, 6)) || !Array.isArray(p.blockedDates) || p.blockedDates.some(d => !dateOK(d))) fail();
    ids.add(p.id); codes.add(p.code);
    return { id: p.id, code: p.code, allowedKinds: [...new Set(p.allowedKinds)], blockedWeekdays: [...new Set(p.blockedWeekdays)], blockedDates: [...new Set(p.blockedDates)] };
  });
  const months = {};
  if (Object.keys(input.months).length > 1000) fail();
  for (const [month, config] of Object.entries(input.months)) {
    if (!monthOK(month) || !config || !Array.isArray(config.holidays) || config.holidays.some(d => !dateOK(d) || !d.startsWith(month)) || !Array.isArray(config.assignments) || config.assignments.length > 124) fail();
    const keys = new Set(), peopleDates = new Set();
    const assignments = config.assignments.map(a => {
      if (!a || !dateOK(a.date) || !a.date.startsWith(month) || !KINDS.includes(a.kind) || ![0, 1].includes(a.seat) || !ids.has(a.participantId) || typeof a.fixed !== 'boolean' || typeof a.override !== 'boolean') fail();
      const key = slotKey(a), personDate = `${a.participantId}/${a.date}`;
      if (keys.has(key) || peopleDates.has(personDate)) fail();
      keys.add(key); peopleDates.add(personDate);
      return { date: a.date, kind: a.kind, seat: a.seat, participantId: a.participantId, fixed: a.fixed, override: a.override };
    });
    // Older backups may carry a monthly holidayMode. It is intentionally dropped:
    // the assignments themselves now describe the coverage of each holiday.
    months[month] = { holidays: [...new Set(config.holidays)], assignments };
    if (config.cityId !== undefined) {
      if (!cityById(config.cityId)) fail();
      months[month].cityId = config.cityId;
    }
  }
  const maxCode = Math.max(0, ...participants.map(p => p.code));
  if (!integer(input.nextCode, maxCode + 1, 1000001)) fail();
  const result = { version: 1, nextCode: input.nextCode, participants, months };
  if (input.cityId !== undefined) {
    if (!cityById(input.cityId)) fail();
    result.cityId = input.cityId;
  }
  return result;
}
export function serialize(state) { return JSON.stringify(anonymousState(state), null, 2); }
export function parseBackup(text) { try { return anonymousState(JSON.parse(text)); } catch { throw new Error('Backup format is invalid or unsupported. Existing data was kept.'); } }

// Greedy restarts with repair. Every candidate is validated; time exhaustion is not an infeasibility proof.
export function generate(state, month, { timeMs = 10000, random = Math.random, onProgress = () => {}, now = () => performance.now() } = {}) {
  const config = state.months[month];
  const dates = monthDates(month);
  const requiredHours = dates.length * 48;
  // A holiday has four half-day coverage units. A 24-hour duty can satisfy two
  // units on one place; day/night duties can satisfy those units independently.
  const units = dates.flatMap(date => [0, 1].flatMap(seat => (holiday(date, config) ? ['day', 'night'] : ['24']).map(kind => ({ date, kind, seat }))));
  const covers = (a, unit) => a.date === unit.date && a.seat === unit.seat && (a.kind === '24' || a.kind === unit.kind);
  const hours = assignments => assignments.reduce((sum, a) => sum + HOURS[a.kind], 0);
  const proposal = (assignments, iterations) => ({ assignments, iterations, coveredHours: hours(assignments), requiredHours, complete: hours(assignments) === requiredHours });
  const outside = allAssignments(state).filter(a => !a.date.startsWith(month));
  const fixed = config.assignments.filter(a => a.fixed);
  for (const [i, a] of fixed.entries()) {
    if (structuralIssues(state, month, a, fixed.filter((_, j) => j !== i)).length) throw new Error('Fixed assignments do not match the shift structure. Remove or edit them first.');
  }
  const score = assignments => {
    const t = Object.values(totals(state, month, assignments));
    const variance = key => t.reduce((sum, v) => sum + v[key] ** 2, 0);
    return [-assignments.reduce((sum, a) => sum + HOURS[a.kind], 0), variance('hours'), variance('holidays') + variance('weekends')];
  };
  const better = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) return a[i] < b[i]; } return false; };
  // Retain a valid existing automatic proposal as an incumbent, without inheriting stale violations.
  let best = [...fixed];
  for (const a of config.assignments.filter(a => !a.fixed)) {
    if (!structuralIssues(state, month, a, [...outside, ...best]).length && !ruleIssues(state, month, a, [...outside, ...best]).length) best.push(a);
  }
  let bestScore = score(best), iterations = 0;
  const start = now();
  onProgress(proposal(best, iterations));
  do {
    // Alternate full restarts with partial repairs of the best proposal.
    const assignments = iterations % 3 === 0 ? [...fixed] : best.filter(a => a.fixed || random() > 0.25);
    let remaining = units.filter(unit => !assignments.some(a => covers(a, unit)));
    while (remaining.length) {
      let choice, candidates, choiceIndex;
      // Minimum remaining values: fill the most constrained seats first.
      for (let i = 0; i < remaining.length; i++) {
        const unit = remaining[i];
        const kinds = unit.kind === '24' ? ['24'] : ['24', unit.kind];
        const others = [...outside, ...assignments];
        const eligible = kinds.flatMap(kind => state.participants.flatMap(p => {
          const a = { date: unit.date, seat: unit.seat, kind, participantId: p.id, fixed: false, override: false };
          return !structuralIssues(state, month, a, others).length && !ruleIssues(state, month, a, others).length ? [a] : [];
        }));
        if (!candidates || eligible.length < candidates.length || (eligible.length === candidates.length && random() < 0.2)) { choice = unit; candidates = eligible; choiceIndex = i; }
        if (!eligible.length) break;
      }
      remaining.splice(choiceIndex, 1);
      if (candidates.length) {
        const t = totals(state, month, assignments);
        const ranked = candidates.map(a => ({ assignment: a, rank: t[a.participantId].hours + (holiday(choice.date, config) ? t[a.participantId].holidays * 3 : 0) + random() * 30 - (a.kind === '24' ? 6 : 0) })).sort((a, b) => a.rank - b.rank);
        assignments.push(ranked[0].assignment);
        remaining = remaining.filter(unit => !covers(ranked[0].assignment, unit));
      }
      if (now() - start >= timeMs) break;
    }
    const nextScore = score(assignments);
    if (better(nextScore, bestScore)) { best = assignments; bestScore = nextScore; onProgress(proposal(best, iterations)); }
    iterations++;
  } while (now() - start < timeMs);
  return proposal(best.sort((a, b) => slotKey(a).localeCompare(slotKey(b))), iterations);
}
