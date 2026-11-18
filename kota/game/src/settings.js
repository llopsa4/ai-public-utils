// Player settings, saved in the browser. Other modules read `values` and listen with onChange.

const SAVE_KEY = 'kota.settings';
const DEFAULTS = { sound: true, leftHanded: false, reduceShake: false, quality: 'high', hints: true };

export function createSettings() {
  const values = { ...DEFAULTS };
  try {
    Object.assign(values, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'));
    if (localStorage.getItem(SAVE_KEY) === null && localStorage.getItem('kota.leftHanded') === '1') values.leftHanded = true;   // old key
  } catch { /* storage unavailable or corrupt: use defaults */ }
  if (values.quality !== 'high' && values.quality !== 'low') values.quality = 'high';

  const listeners = [];
  return {
    values,
    set(key, value) {
      values[key] = value;
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(values)); } catch { /* ignore */ }
      for (const fn of listeners) fn(key, value);
    },
    onChange(fn) { listeners.push(fn); },
  };
}
