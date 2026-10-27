import { HOLIDAY_DATA } from './holiday-data.mjs';

export { HOLIDAY_DATA };
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
const nameCounts = new Map();
for (const entry of Object.values(HOLIDAY_DATA.cities)) nameCounts.set(entry.name, (nameCounts.get(entry.name) ?? 0) + 1);
export const CITIES = Object.entries(HOLIDAY_DATA.cities).map(([id, entry]) => ({ id, name: entry.name, label: nameCounts.get(entry.name) > 1 ? `${entry.name} (${id})` : entry.name })).sort((a, b) => a.name.localeCompare(b.name, 'en'));
const cityMap = new Map(CITIES.map(city => [city.id, city]));
const localDates = new Map(Object.entries(HOLIDAY_DATA.cities).map(([id, city]) => [id, new Set(city.dates)]));
const generalDates = new Set(HOLIDAY_DATA.general);
// All settlements sharing these INE municipality prefixes are in Aran.
// Generalitat's 2026 calendar replaces St Stephen's Day with Aran Day there.
const ARAN = new Set(['25025', '25031', '25045', '25057', '25059', '25063', '25121', '25243', '25247']);
const PUBLIC_NAMES = {
  '01-01': "New Year's Day", '01-06': 'Epiphany', '04-03': 'Good Friday',
  '04-06': 'Easter Monday', '05-01': 'Labour Day', '06-17': 'Aran Day',
  '06-24': "Saint John's Day", '08-15': 'Assumption Day', '09-11': 'National Day of Catalonia',
  '10-12': 'National Day of Spain', '12-08': 'Immaculate Conception', '12-25': 'Christmas Day', '12-26': "Saint Stephen's Day",
};
export function cityById(id) { return cityMap.get(id) ?? null; }
export function findCity(text) {
  const query = normalize(text);
  const exact = CITIES.filter(city => normalize(city.label) === query || normalize(city.id) === query);
  if (exact.length === 1) return exact[0];
  const byName = CITIES.filter(city => normalize(city.name) === query);
  return byName.length === 1 ? byName[0] : null;
}
export function cityYearAvailable(cityId, year) { return Boolean(cityById(cityId)) && String(year) === HOLIDAY_DATA.year; }
export function isLocalHoliday(cityId, date) { return localDates.get(cityId)?.has(date) ?? false; }
export function isGeneralHoliday(cityId, date) {
  if (!cityYearAvailable(cityId, date.slice(0, 4))) return false;
  if (ARAN.has(cityId.slice(0, 5))) {
    if (date.endsWith('-12-26')) return false;
    if (date.endsWith('-06-17')) return true;
  }
  return generalDates.has(date);
}
export function isOfficialHoliday(cityId, date) { return isLocalHoliday(cityId, date) || isGeneralHoliday(cityId, date); }
export function holidayDetails(date, config) {
  const local = isLocalHoliday(config.cityId, date), general = isGeneralHoliday(config.cityId, date);
  const manual = config.holidays.includes(date);
  const weekend = [0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay());
  return { local, general, manual, weekend,
    label: local ? 'Local holiday' : general ? 'Public holiday' : manual ? 'Added holiday' : weekend ? 'Weekend' : '',
    name: local ? `Local holiday in ${cityById(config.cityId).name}` : general ? PUBLIC_NAMES[date.slice(5)] ?? 'Public holiday' : manual ? 'Manually added holiday' : weekend ? 'Weekend' : '',
  };
}
