import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { CITIES, HOLIDAY_DATA, findCity, cityById, cityYearAvailable, holidayDetails, isOfficialHoliday, isGeneralHoliday } from '../holidays.mjs';
import { emptyState, newMonth, holiday, slotsForDate, ruleIssues, structuralIssues, serialize, parseBackup } from '../core.mjs';

test('official snapshot has known Catalan municipal and general dates', () => {
  assert.ok(CITIES.length > 900);
  assert.equal(HOLIDAY_DATA.year, '2026');
  assert.equal(findCity('girona').id, '17079000');
  assert.equal(findCity('Quart').id, '17142000');
  assert.ok(isOfficialHoliday(findCity('Girona').id, '2026-10-29'));
  assert.ok(isOfficialHoliday(findCity('Barcelona').id, '2026-09-24'));
  assert.ok(!isOfficialHoliday(findCity('Barcelona').id, '2026-10-29'));
  assert.ok(isGeneralHoliday(findCity('Girona').id, '2026-10-12'));
});
test('city matching accepts accents without persisting unrecognized free text', () => {
  assert.equal(findCity('Bossost').name, 'Bossòst');
  assert.equal(findCity('PRIVATE_TEST_SENTINEL'), null);
  const s = emptyState(); s.cityId = 'PRIVATE_TEST_SENTINEL';
  assert.throws(() => serialize(s));
});
test('local holidays change scheduling rules but do not pollute manual holiday dates', () => {
  const config = { ...newMonth(), cityId: findCity('Girona').id };
  assert.ok(holiday('2026-10-29', config));
  config.assignments = [{ date: '2026-10-29', seat: 0, kind: 'day' }];
  assert.equal(slotsForDate('2026-10-29', config).length, 3);
  assert.equal(holidayDetails('2026-10-29', config).label, 'Local holiday');
  assert.equal(holidayDetails('2026-10-12', config).label, 'Public holiday');
  assert.equal(holidayDetails('2026-10-03', config).label, 'Weekend');
  config.cityId = findCity('Barcelona').id;
  assert.equal(holiday('2026-10-29', config), false);
  assert.deepEqual(config.holidays, []);
});
test('Aran uses June 17 instead of December 26 as its general holiday', () => {
  const id = findCity('Vielha').id;
  assert.ok(isGeneralHoliday(id, '2026-06-17'));
  assert.ok(!isGeneralHoliday(id, '2026-12-26'));
  assert.ok(isGeneralHoliday(findCity('Girona').id, '2026-12-26'));
});
test('official local/public dates count toward the holiday cap and permit 12-hour shifts', () => {
  const s = emptyState(), id = randomUUID();
  s.participants = [{ id, code: 1, allowedKinds: ['24', 'day', 'night'], blockedWeekdays: [], blockedDates: [] }];
  s.nextCode = 2; s.cityId = findCity('Girona').id;
  s.months['2026-10'] = { ...newMonth(), cityId: s.cityId };
  const first = { date: '2026-10-12', kind: '24', seat: 0, participantId: id, fixed: true, override: false };
  const next = { ...first, date: '2026-10-29', kind: 'day' };
  assert.ok(ruleIssues(s, '2026-10', next, [first]).includes('Monthly holiday limit exceeded'));
  assert.deepEqual(structuralIssues(s, '2026-10', next, []), []);
});
test('missing years never reuse or predict the available municipal dates', () => {
  const id = findCity('Girona').id;
  assert.ok(!cityYearAvailable(id, '2027'));
  assert.ok(!isOfficialHoliday(id, '2027-10-29'));
  assert.equal(cityById('not-a-city'), null);
});
test('city codes round-trip through anonymous backups; no city free text survives', () => {
  const s = emptyState(); s.cityId = findCity('Girona').id;
  s.months['2026-10'] = { ...newMonth(), cityId: s.cityId };
  s.cityInput = 'PRIVATE_TEST_SENTINEL'; s.cityName = 'PRIVATE_TEST_SENTINEL';
  const text = serialize(s);
  assert.ok(!text.includes('PRIVATE_TEST_SENTINEL'));
  const restored = parseBackup(text);
  assert.equal(restored.cityId, s.cityId);
  assert.equal(restored.months['2026-10'].cityId, s.cityId);
});
