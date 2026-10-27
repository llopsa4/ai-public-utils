import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { emptyState, newMonth, monthDates, shiftDate, shiftMonth, slotsForDate, slotsForMonth, holiday, ruleIssues, structuralIssues, audit, totals, serialize, parseBackup, generate, exclusiveKinds, holidayDutyLimit } from '../core.mjs';

const month = '2026-10';
function fixture(count = 20) {
  const state = emptyState();
  state.months[month] = newMonth();
  for (let i = 0; i < count; i++) state.participants.push({ id: randomUUID(), code: state.nextCode++, allowedKinds: ['24'], blockedWeekdays: [], blockedDates: [] });
  return state;
}
const assignment = (state, date = '2026-10-01', kind = '24', seat = 0, index = 0) => ({ date, kind, seat, participantId: state.participants[index].id, fixed: false, override: false });
function seeded(seed = 12345) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }; }
// A simulated deadline makes correctness tests independent of machine speed.
// The browser suite separately exercises the real 10-second worker deadline.
function searchOptions() { let ticks = 0; return { timeMs: 1, random: seeded(), now: () => ticks++ < 100 ? 0 : 1000 }; }

test('calendar handles leap years, year boundaries, and all month lengths', () => {
  assert.equal(monthDates('2028-02').length, 29);
  assert.equal(monthDates('2027-02').length, 28);
  assert.equal(monthDates('2026-04').length, 30);
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
});
test('each date requires 48 hours with each possible holiday combination', () => {
  const config = newMonth();
  for (const pattern of ['12', '24', 'mixed']) {
    config.assignments = monthDates(month).filter(d => holiday(d, config)).flatMap(date => {
      const splitSeats = pattern === '12' ? [0, 1] : pattern === 'mixed' ? [1] : [];
      return splitSeats.map(seat => ({ date, seat, kind: 'day' }));
    });
    for (const date of monthDates(month)) {
      const slots = slotsForDate(date, config);
      assert.equal(slots.reduce((sum, s) => sum + (s.kind === '24' ? 24 : 12), 0), 48);
      assert.equal(slots.length, holiday(date, config) ? { '12': 4, '24': 2, mixed: 3 }[pattern] : 2);
    }
  }
});
test('marked weekday holiday can have split coverage', () => {
  const config = newMonth(); config.holidays = ['2026-10-01'];
  config.assignments = [0, 1].map(seat => ({ date: '2026-10-01', kind: 'day', seat }));
  assert.equal(slotsForDate('2026-10-01', config).length, 4);
  assert.equal(slotsForDate('2026-10-02', config).length, 2);
});
test('mixed holidays have one 24-hour duty plus separate day and night duties', () => {
  const config = { ...newMonth(), assignments: [{ date: '2026-10-03', kind: 'day', seat: 1 }] };
  const expected = [
    { date: '2026-10-03', kind: '24', seat: 0 },
    { date: '2026-10-03', kind: 'day', seat: 1 },
    { date: '2026-10-03', kind: 'night', seat: 1 },
  ];
  assert.deepEqual(slotsForDate('2026-10-03', config), expected);
  assert.equal(slotsForDate('2026-10-01', config).length, 2);
  config.holidays.push('2026-10-01');
  config.assignments.push({ date: '2026-10-01', kind: 'day', seat: 1 });
  assert.deepEqual(slotsForDate('2026-10-01', config).map(s => s.kind), ['24', 'day', 'night']);
});
test('mixed holiday assignments survive backup round trip and generation', () => {
  const s = fixture(30);
  s.participants[1].allowedKinds = ['day']; s.participants[2].allowedKinds = ['night'];
  const fixed = { ...assignment(s, '2026-10-03'), fixed: true };
  s.months[month].assignments = [fixed, { ...assignment(s, '2026-10-03', 'day', 1, 1), fixed: true }, { ...assignment(s, '2026-10-03', 'night', 1, 2), fixed: true }];
  assert.deepEqual(parseBackup(serialize(s)), s);
  const result = generate(s, month, searchOptions());
  assert.ok(result.assignments.some(a => a === fixed));
  s.months[month].assignments = result.assignments;
  assert.deepEqual(audit(s, month), []);
  const duties = result.assignments.filter(a => a.date === '2026-10-03');
  assert.deepEqual(duties.map(a => a.kind).sort(), ['24', 'day', 'night'].sort());
  assert.equal(new Set(duties.map(a => a.participantId)).size, 3);
  assert.equal(duties.reduce((sum, a) => sum + (a.kind === '24' ? 24 : 12), 0), 48);
});
test('individual shift permissions and blocked weekdays/dates are enforced', () => {
  const s = fixture(1), p = s.participants[0];
  p.allowedKinds = ['night']; p.blockedWeekdays = [4]; p.blockedDates = ['2026-10-01'];
  assert.deepEqual(ruleIssues(s, month, assignment(s), []), ['Shift type is not allowed', 'Weekday is blocked', 'Date is blocked']);
  assert.equal(ruleIssues(s, month, assignment(s, '2026-10-02', 'night'), []).length, 0);
});
test('date blocking does not recur the next month', () => {
  const s = fixture(1); s.participants[0].blockedDates = ['2026-10-01']; s.months['2026-11'] = newMonth();
  assert.equal(ruleIssues(s, '2026-11', assignment(s, '2026-11-01'), []).length, 0);
});
test('rest checks both adjacent dates, including month and year boundaries', () => {
  const s = fixture(1);
  assert.ok(ruleIssues(s, month, assignment(s), [assignment(s, '2026-09-30')]).includes('Consecutive work dates'));
  assert.ok(ruleIssues(s, month, assignment(s, '2026-10-31'), [assignment(s, '2026-11-01')]).includes('Consecutive work dates'));
  assert.ok(ruleIssues(s, '2027-01', assignment(s, '2027-01-01'), [assignment(s, '2026-12-31')]).includes('Consecutive work dates'));
});
test('holiday and non-holiday monthly caps are independent and reset each month', () => {
  const s = fixture(1);
  assert.ok(ruleIssues(s, month, assignment(s, '2026-10-10'), [assignment(s, '2026-10-03')]).includes('Monthly holiday limit exceeded'));
  const ordinary = ['2026-10-01', '2026-10-05', '2026-10-07'].map(d => assignment(s, d));
  assert.ok(ruleIssues(s, month, assignment(s, '2026-10-09'), ordinary).includes('Monthly non-holiday limit exceeded'));
  assert.ok(!ruleIssues(s, month, assignment(s, '2026-10-10'), ordinary).includes('Monthly holiday limit exceeded'));
  assert.ok(!ruleIssues(s, '2026-11', assignment(s, '2026-11-07'), [assignment(s, '2026-10-03')]).includes('Monthly holiday limit exceeded'));
});
test('cannot double a seat or work day and night on the same date', () => {
  const s = fixture(2);
  const day = assignment(s, '2026-10-03', 'day');
  assert.ok(structuralIssues(s, month, assignment(s, '2026-10-03', 'night'), [day]).includes('A person cannot work two shifts on one date'));
  assert.ok(structuralIssues(s, month, assignment(s, '2026-10-03', 'day', 0, 1), [day]).includes('Seat already occupied'));
  assert.ok(structuralIssues(s, month, assignment(s, '2026-10-03', '24', 0, 1), [day]).includes('Seat already occupied'));
  assert.ok(structuralIssues(s, month, assignment(s, '2026-10-01', 'day'), []).includes('Non-holidays require 24-hour duties'));
});

test('short-shift holiday allowance is two duties on separate dates, bounded by 24 hours', () => {
  const s = fixture(1), p = s.participants[0]; p.allowedKinds = ['day', 'night'];
  const first = assignment(s, '2026-10-03', 'day'), second = assignment(s, '2026-10-10', 'night'), third = assignment(s, '2026-10-17', 'day');
  assert.equal(holidayDutyLimit(p), 2);
  assert.deepEqual(ruleIssues(s, month, second, [first]), []);
  assert(ruleIssues(s, month, third, [first, second]).includes('Monthly holiday limit exceeded'));
  assert(structuralIssues(s, month, { ...first, kind: 'night' }, [first]).includes('A person cannot work two shifts on one date'));
  assert(ruleIssues(s, month, { ...second, date: '2026-10-04' }, [first]).includes('Consecutive work dates'));
  assert(!ruleIssues(s, '2026-11', { ...third, date: '2026-11-07' }, [first, second]).includes('Monthly holiday limit exceeded'));
  // A retained old 24-hour duty already consumes the full holiday allowance.
  assert(ruleIssues(s, month, second, [{ ...first, kind: '24' }]).includes('Monthly holiday limit exceeded'));
  s.months[month].assignments = [first, second];
  assert.equal(totals(s, month)[p.id].holidayHours, 24);
  assert.equal(totals(s, month)[p.id].holidays, 2);
  assert.deepEqual(parseBackup(serialize(s)), s);
});

test('mixed permissions migrate to 24 hours while saved assignments remain intact', () => {
  const s = fixture(1); s.participants[0].allowedKinds = ['24', 'day', 'night'];
  s.months[month].assignments = [{ ...assignment(s, '2026-10-03', 'day'), fixed: true }];
  const migrated = parseBackup(JSON.stringify(s));
  assert.deepEqual(migrated.participants[0].allowedKinds, ['24']);
  assert.deepEqual(migrated.months[month].assignments, s.months[month].assignments);
  assert(audit(migrated, month).some(i => i.message === 'Shift type is not allowed'));
  assert.deepEqual(exclusiveKinds(['night', 'day', 'day']), ['day', 'night']);
  assert.deepEqual(exclusiveKinds([]), []);
  assert.equal(holidayDutyLimit(migrated.participants[0]), 1);
  assert(ruleIssues(s, month, assignment(s, '2026-10-10', 'day'), []).includes('Shift type is not allowed'));
});

test('generation can assign two short holiday duties to each participant without exceptions', () => {
  const s = fixture(4), dates = ['2026-10-03', '2026-10-10'];
  for (const p of s.participants) {
    p.allowedKinds = ['day', 'night'];
    p.blockedDates = monthDates(month).filter(d => !dates.includes(d));
  }
  const result = generate(s, month, searchOptions());
  s.months[month].assignments = result.assignments;
  assert.equal(result.assignments.length, 8);
  assert(result.assignments.every(a => a.kind !== '24' && !a.override));
  assert.deepEqual(audit(s, month), []);
  for (const t of Object.values(totals(s, month))) { assert.equal(t.holidays, 2); assert.equal(t.holidayHours, 24); }
});
test('audit exposes manual exceptions and stale shift structures', () => {
  const s = fixture(1), a = assignment(s); a.fixed = true; a.override = true;
  s.participants[0].blockedDates = [a.date]; s.months[month].assignments = [a];
  assert.equal(audit(s, month)[0].message, 'Date is blocked');
  a.kind = 'day';
  assert.ok(audit(s, month).some(i => i.message === 'Non-holidays require 24-hour duties'));
});
test('workload accounts for 12/24-hour duties and holiday categories', () => {
  const s = fixture(1); s.months[month].assignments = [assignment(s), assignment(s, '2026-10-03', 'day')];
  assert.deepEqual(totals(s, month)[s.participants[0].id], { hours: 36, holidayHours: 12, holidays: 1, ordinary: 1, weekends: 1 });
});
test('privacy allowlist removes names and arbitrary nested metadata', () => {
  const s = fixture(1);
  s.names = { [s.participants[0].id]: 'PRIVATE_TEST_SENTINEL' };
  s.participants[0].name = 'PRIVATE_TEST_SENTINEL';
  s.participants[0].notes = { secret: 'PRIVATE_TEST_SENTINEL' };
  s.months[month].assignments = [{ ...assignment(s), name: 'PRIVATE_TEST_SENTINEL' }];
  s.months[month].names = ['PRIVATE_TEST_SENTINEL'];
  const text = serialize(s);
  assert.ok(!text.includes('PRIVATE_TEST_SENTINEL'));
  assert.ok(!text.includes('name'));
  assert.deepEqual(Object.keys(parseBackup(text).participants[0]), ['id', 'code', 'allowedKinds', 'blockedWeekdays', 'blockedDates']);
});
test('backup round trip preserves anonymous restrictions and fixed exceptions', () => {
  const s = fixture(2); s.participants[0].blockedDates = ['2026-10-07'];
  s.months[month].assignments = [{ ...assignment(s), fixed: true, override: true }];
  assert.deepEqual(parseBackup(serialize(s)), s);
});
test('malformed, unsupported, duplicate, dangling, or identifiable IDs are rejected', () => {
  for (const input of ['{}', '{', '{"version":2}']) assert.throws(() => parseBackup(input));
  for (const mutate of [s => { s.participants[0].id = 'Person Name'; }, s => { s.participants[0].blockedDates = ['2026-02-30']; }, s => { s.months[month].assignments = [assignment(s), assignment(s)]; }, s => { s.months[month].assignments = [{ ...assignment(s), participantId: randomUUID() }]; }, s => { s.participants.push(s.participants[0]); }]) {
    const s = fixture(1); mutate(s); assert.throws(() => parseBackup(JSON.stringify(s)));
  }
});
test('bounded generation retains fixed assignments and introduces no rule violations', () => {
  const s = fixture(20); const fixed = { ...assignment(s), fixed: true }; s.months[month].assignments = [fixed];
  const result = generate(s, month, searchOptions());
  assert.ok(result.assignments.some(a => a.fixed && a.participantId === fixed.participantId && a.date === fixed.date));
  assert.ok(result.assignments.length > 20);
  s.months[month].assignments = result.assignments;
  assert.deepEqual(audit(s, month), []);
  for (const t of Object.values(totals(s, month))) { assert.ok(t.holidays <= 1); assert.ok(t.ordinary <= 3); }
});
test('20 people allowing only 12-hour duties return a partial proposal without breaking caps', () => {
  const s = fixture(20); s.participants.forEach(p => { p.allowedKinds = ['day', 'night']; });
  const result = generate(s, month, searchOptions());
  assert.equal(result.complete, false);
  assert.ok(result.coveredHours < result.requiredHours);
  s.months[month].assignments = result.assignments;
  assert.deepEqual(audit(s, month), []);
});
test('generator honors adjacent saved month and type-only participants', () => {
  const s = fixture(2); s.months['2026-09'] = { ...newMonth(), assignments: [assignment(s, '2026-09-30')] };
  s.participants[1].allowedKinds = ['night'];
  const result = generate(s, month, searchOptions());
  assert.ok(!result.assignments.some(a => a.date === '2026-10-01' && a.participantId === s.participants[0].id));
  assert.ok(result.assignments.filter(a => a.participantId === s.participants[1].id).every(a => a.kind === 'night' && holiday(a.date, s.months[month])));
});
test('existing confirmed exceptions remain fixed, new automatic exceptions never appear', () => {
  const s = fixture(8), a = { ...assignment(s), fixed: true, override: true };
  s.participants[0].blockedDates = [a.date]; s.months[month].assignments = [a];
  const result = generate(s, month, searchOptions());
  assert.ok(result.assignments.includes(a));
  assert.ok(result.assignments.filter(a => !a.fixed).every(a => !a.override));
  s.months[month].assignments = result.assignments;
  assert.ok(audit(s, month).every(i => i.assignment.fixed));
});
test('generation blocks fixed short duties after a weekday is no longer marked as a holiday', () => {
  const s = fixture(2);
  s.months[month].assignments = [{ ...assignment(s, '2026-10-01', 'day'), fixed: true }];
  assert.throws(() => generate(s, month, { timeMs: 1 }), /Fixed assignments/);
});
