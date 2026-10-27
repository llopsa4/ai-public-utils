import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { newMonth, emptyState, slotsForDate, structuralIssues, audit, generate, serialize, parseBackup, monthDates, holiday, HOURS } from '../core.mjs';
const month = '2026-10';
function fixture(count = 8) {
  const state = emptyState(); state.months[month] = newMonth();
  for (let i = 0; i < count; i++) state.participants.push({ id: randomUUID(), code: state.nextCode++, allowedKinds: ['24', 'day', 'night'], blockedWeekdays: [], blockedDates: [] });
  return state;
}
const duty = (s, date, kind, seat, person) => ({ date, kind, seat, participantId: s.participants[person].id, fixed: true, override: false });
test('every holiday accepts all three coverage combinations without a mode', () => {
  const s = fixture();
  for (const assignments of [
    [duty(s, '2026-10-03', '24', 0, 0), duty(s, '2026-10-03', '24', 1, 1)],
    [duty(s, '2026-10-03', '24', 0, 0), duty(s, '2026-10-03', 'day', 1, 1), duty(s, '2026-10-03', 'night', 1, 2)],
    [duty(s, '2026-10-03', 'day', 0, 0), duty(s, '2026-10-03', 'night', 0, 1), duty(s, '2026-10-03', 'day', 1, 2), duty(s, '2026-10-03', 'night', 1, 3)],
  ]) {
    s.months[month].assignments = assignments;
    assert.deepEqual(audit(s, month), []);
    assert.equal(slotsForDate('2026-10-03', s.months[month]).length, assignments.length);
    assert.equal(assignments.reduce((n, a) => n + HOURS[a.kind], 0), 48);
  }
});
test('24-hour coverage cannot overlap a 12-hour shift on the same place', () => {
  const s = fixture();
  const long = duty(s, '2026-10-03', '24', 0, 0), short = duty(s, '2026-10-03', 'day', 0, 1);
  assert.ok(structuralIssues(s, month, long, [short]).length);
  assert.ok(structuralIssues(s, month, short, [long]).length);
});
test('legacy monthly modes are discarded without losing existing assignments', () => {
  const s = fixture(); s.months[month].holidayMode = '12';
  s.months[month].assignments = [duty(s, '2026-10-03', '24', 0, 0), duty(s, '2026-10-03', 'day', 1, 1)];
  const restored = parseBackup(serialize(s));
  assert.equal(restored.months[month].holidayMode, undefined);
  assert.deepEqual(restored.months[month].assignments, s.months[month].assignments);
});
test('generator chooses different holiday combinations in a single month', () => {
  const s = fixture(9), dates = ['2026-10-03', '2026-10-10', '2026-10-17'];
  const kinds = [['24'], ['24'], ['24'], ['day'], ['night'], ['day'], ['night'], ['day'], ['night']];
  s.participants.forEach((p, i) => {
    p.allowedKinds = kinds[i];
    const available = i < 2 ? dates[0] : i < 5 ? dates[1] : dates[2];
    p.blockedDates = monthDates(month).filter(d => d !== available);
  });
  let ticks = 0;
  const result = generate(s, month, { timeMs: 1, random: () => 0.5, now: () => ticks++ < 200 ? 0 : 1000 });
  s.months[month].assignments = result.assignments;
  assert.deepEqual(audit(s, month), []);
  for (const [i, date] of dates.entries()) {
    const actual = result.assignments.filter(a => a.date === date);
    assert.equal(actual.length, [2, 3, 4][i]);
    assert.equal(actual.reduce((n, a) => n + HOURS[a.kind], 0), 48);
  }
});
