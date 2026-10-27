import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { emptyState, newMonth, KINDS, movedAssignments, moveTargets, coverageStatus, slotKey, slotsForDate, serialize, parseBackup, totals } from '../core.mjs';

const month = '2026-10';
function fixture() {
  const state = emptyState(); state.months[month] = newMonth();
  for (let i = 0; i < 5; i++) state.participants.push({ id: randomUUID(), code: state.nextCode++, allowedKinds: ['24'], blockedWeekdays: [], blockedDates: [] });
  return state;
}
const duty = (state, date, kind = '24', seat = 0, person = 0) => ({ date, kind, seat, participantId: state.participants[person].id, fixed: false, override: false });
const target = (date = '2026-10-05', kind = '24', seat = 0) => ({ date, kind, seat });

test('moving is atomic, excludes the source from rules, fixes the result, and round-trips anonymously', () => {
  const state = fixture(), source = duty(state, '2026-10-01');
  source.override = true;
  state.months[month].assignments = [source, duty(state, '2026-10-08'), duty(state, '2026-10-12')];
  const before = serialize(state), hours = totals(state, month)[source.participantId].hours;
  const result = movedAssignments(state, month, slotKey(source), target('2026-10-02'));
  assert.equal(serialize(state), before, 'Core returns a proposal without editing state');
  assert.equal(result.length, 3);
  assert(!result.some(a => a.date === source.date));
  assert.deepEqual(result.at(-1), { ...target('2026-10-02'), participantId: source.participantId, fixed: true, override: false });
  state.months[month].assignments = result;
  assert.equal(totals(state, month)[source.participantId].hours, hours);
  assert.deepEqual(parseBackup(serialize(state)), state);
});

test('occupied, overlapping, duplicate person, wrong shift, and out-of-month targets cannot move', () => {
  const state = fixture(), source = duty(state, '2026-10-01');
  state.months[month].assignments = [source, duty(state, '2026-10-05', '24', 0, 1), duty(state, '2026-10-07', '24', 1)];
  for (const spot of [target(), target('2026-10-07'), target('2026-10-03', 'day'), target('2026-11-02'), target(source.date), target('2026-10-05', '24', 2)]) {
    const before = serialize(state);
    assert.throws(() => movedAssignments(state, month, slotKey(source), spot));
    assert.equal(serialize(state), before);
    assert(!moveTargets(state, month, slotKey(source)).some(s => slotKey(s) === slotKey(spot)));
  }
});

test('blocked dates/weekdays, permissions, rest and caps all exclude targets', () => {
  for (const restriction of ['date', 'weekday', 'kind', 'rest', 'cap']) {
    const state = fixture(), source = duty(state, '2026-10-01'), p = state.participants[0];
    state.months[month].assignments = [source];
    if (restriction === 'date') p.blockedDates = ['2026-10-05'];
    if (restriction === 'weekday') p.blockedWeekdays = [1];
    if (restriction === 'kind') p.allowedKinds = ['day'];
    if (restriction === 'rest') state.months[month].assignments.push(duty(state, '2026-10-06'));
    if (restriction === 'cap') state.months[month].assignments.push(...['08', '12', '14'].map(d => duty(state, `2026-10-${d}`)));
    assert.throws(() => movedAssignments(state, month, slotKey(source), target()), restriction);
    assert(!moveTargets(state, month, slotKey(source)).some(s => s.date === '2026-10-05'), restriction);
  }
});

test('moving respects saved adjacent months and holiday caps', () => {
  const state = fixture(), source = duty(state, '2026-10-05');
  state.months[month].assignments = [source];
  state.months['2026-09'] = { ...newMonth(), assignments: [duty(state, '2026-09-30')] };
  assert.throws(() => movedAssignments(state, month, slotKey(source), target('2026-10-01')), /Consecutive/);
  state.months[month].assignments.push(duty(state, '2026-10-10'));
  assert.throws(() => movedAssignments(state, month, slotKey(source), target('2026-10-17')), /holiday limit/);
});

test('short duties reveal empty holiday targets and establish a split only on commit', () => {
  for (const kind of ['day', 'night']) {
    const state = fixture(), source = duty(state, '2026-10-03', kind);
    state.participants[0].allowedKinds = [kind];
    state.months[month].assignments = [source];
    const before = serialize(state), spots = moveTargets(state, month, slotKey(source));
    assert(spots.some(s => s.date === '2026-10-10' && s.kind === kind));
    assert(!spots.some(s => s.date === '2026-10-05'));
    assert.equal(serialize(state), before);
    state.months[month].assignments = movedAssignments(state, month, slotKey(source), target('2026-10-10', kind));
    assert.deepEqual(slotsForDate(source.date, state.months[month]).map(s => s.kind), ['24', '24']);
    assert.deepEqual(slotsForDate('2026-10-10', state.months[month]).map(s => s.kind), ['day', 'night', '24']);
  }
});

test('short duties cannot overlap an occupied 24-hour place or switch day/night', () => {
  const state = fixture(), source = duty(state, '2026-10-03', 'day');
  state.participants[0].allowedKinds = ['day'];
  state.months[month].assignments = [source, duty(state, '2026-10-10', '24', 0, 1)];
  assert.throws(() => movedAssignments(state, month, slotKey(source), target('2026-10-10', 'day')), /occupied/);
  assert.throws(() => movedAssignments(state, month, slotKey(source), target('2026-10-10', 'night', 1)), /shift type/);
});

test('coverage distinguishes legitimate mixed holidays from overlaps, including simultaneous gaps', () => {
  const state = fixture(), date = '2026-10-03';
  const mixed = [duty(state, date), duty(state, date, 'day', 1, 1), duty(state, date, 'night', 1, 2)];
  assert.deepEqual(coverageStatus(date, mixed), { missing: false, overstaffed: false });
  const split = [duty(state, date, 'day', 0), duty(state, date, 'night', 0, 1), duty(state, date, 'day', 1, 2), duty(state, date, 'night', 1, 3)];
  assert.deepEqual(coverageStatus(date, split), { missing: false, overstaffed: false });
  const overlap = [duty(state, date), duty(state, date, 'day', 0, 1)];
  state.months[month].assignments = overlap;
  assert.deepEqual(coverageStatus(date, parseBackup(serialize(state)).months[month].assignments), { missing: true, overstaffed: true });
  assert.deepEqual(coverageStatus(date, [...mixed, duty(state, date, 'day', 0, 3)]), { missing: false, overstaffed: true });
  assert.deepEqual(coverageStatus(date, [mixed[0], mixed[0]]), { missing: true, overstaffed: true });
  assert.deepEqual(coverageStatus(date, []), { missing: true, overstaffed: false });
});
