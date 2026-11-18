// The camp save (DESIGN-m1.md sections 11 and 15): goods, built upgrades, bosses met, totals. Stored on this device
// under `kota.v2.camp`; old `kota.*` keys from the 3D game are ignored.

const KEY = 'kota.v2.camp';
const strings = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

export function loadCamp() {
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(KEY) || '{}') ?? {}; } catch { /* a blank camp is fine */ }
  return { goods: num(raw.goods), built: strings(raw.built), met: strings(raw.met), runs: num(raw.runs), wins: num(raw.wins), bestWave: num(raw.bestWave) };
}

export function saveCamp(camp) {
  try { localStorage.setItem(KEY, JSON.stringify(camp)); } catch { /* private mode: the camp lasts this session only */ }
}

/** Sum what the built upgrades change in a run: extra food healing, food chance, starting stats. */
export function campBonus(camp, upgrades) {
  const bonus = { foodHeal: 0, foodChance: 0, stats: {} };
  for (const u of upgrades) {
    if (!camp.built.includes(u.id)) continue;
    bonus.foodHeal += u.mods?.foodHeal ?? 0;
    bonus.foodChance += u.mods?.foodChance ?? 0;
    for (const [k, v] of Object.entries(u.startStats ?? {})) bonus.stats[k] = (bonus.stats[k] ?? 0) + v;
  }
  return bonus;
}

/** Goods earned by a run: 1 per wave cleared, +3 for Double-Face, +8 for Iya. */
export function goodsFor(data, wavesCleared, defeated) {
  return wavesCleared * data.goodsPerWave + (defeated.has('double_face') ? data.goodsDoubleFace : 0) + (defeated.has('iya') ? data.goodsIya : 0);
}

/** Record a finished (or abandoned) run in the camp and save. Returns the goods earned. */
export function recordRun(camp, data, { wavesCleared, won, met, defeated, finished = true }) {
  const goods = finished ? goodsFor(data, wavesCleared, defeated) : 0;
  camp.goods += goods;
  for (const id of met) if (!camp.met.includes(id)) camp.met.push(id);
  if (finished) {
    camp.runs++;
    if (won) camp.wins++;
    camp.bestWave = Math.max(camp.bestWave, wavesCleared);
  }
  saveCamp(camp);
  return goods;
}
