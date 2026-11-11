/** Player preferences (not game progress), kept in localStorage like the language choice. */
export interface Settings {
  textSpeed: 'slow' | 'normal' | 'fast';
  /** Effects and ambience, 0..1 */
  volume: number;
  /** Music, 0..1 */
  musicVolume: number;
  muted: boolean;
  /** When false, each spoken line waits for a click. */
  reducedMotion: boolean;
  /** Size of all interface text. */
  textSize: 's' | 'm' | 'l';
  /** Solid, high-contrast panels and labels. */
  highContrast: boolean;
  /** High: shaders (colour grading, haze, reflections, glows) and full particles. Low: none of that. */
  visualQuality: 'high' | 'low';
}

const STORAGE_KEY = 'cinderfold.settings';
const SPEEDS: Settings['textSpeed'][] = ['slow', 'normal', 'fast'];
const SIZES: Settings['textSize'][] = ['s', 'm', 'l'];
const QUALITIES: Settings['visualQuality'][] = ['high', 'low'];
/** Interface text scale per size setting. */
export const TEXT_SCALE: Record<Settings['textSize'], number> = { s: 0.85, m: 1, l: 1.3 };
const SPEED_FACTOR: Record<Settings['textSpeed'], number> = { slow: 1.5, normal: 1, fast: 0.65 };

export function defaultSettings(prefersReducedMotion = false, touch = false): Settings {
  return {
    visualQuality: touch ? 'low' : 'high', textSpeed: 'normal', volume: 0.7, musicVolume: 0.5, muted: false, reducedMotion: prefersReducedMotion, textSize: 'm', highContrast: false };
}

/** Accepts only well-formed values; anything missing or invalid falls back to the default. */
export function parseSettings(raw: unknown, fallback: Settings): Settings {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ...fallback };
  const r = raw as Record<string, unknown>;
  return {
    textSpeed: SPEEDS.includes(r.textSpeed as Settings['textSpeed']) ? (r.textSpeed as Settings['textSpeed']) : fallback.textSpeed,
    volume: typeof r.volume === 'number' && Number.isFinite(r.volume) ? Math.min(1, Math.max(0, r.volume)) : fallback.volume,
    musicVolume: typeof r.musicVolume === 'number' && Number.isFinite(r.musicVolume) ? Math.min(1, Math.max(0, r.musicVolume)) : fallback.musicVolume,
    muted: typeof r.muted === 'boolean' ? r.muted : fallback.muted,
    reducedMotion: typeof r.reducedMotion === 'boolean' ? r.reducedMotion : fallback.reducedMotion,
    textSize: SIZES.includes(r.textSize as Settings['textSize']) ? (r.textSize as Settings['textSize']) : fallback.textSize,
    highContrast: typeof r.highContrast === 'boolean' ? r.highContrast : fallback.highContrast,
    visualQuality: QUALITIES.includes(r.visualQuality as Settings['visualQuality']) ? (r.visualQuality as Settings['visualQuality']) : fallback.visualQuality,
  };
}

/** How long a line stays up before advancing on its own. */
export function lineDuration(text: string, speed: Settings['textSpeed']): number {
  return Math.round(Math.min(7000, Math.max(1500, 900 + text.length * 55)) * SPEED_FACTOR[speed]);
}

let current: Settings = defaultSettings();
const listeners = new Set<(s: Settings) => void>();

export function loadSettings(): Settings {
  const reduce = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  // Phones and tablets start on Low quality (shaders drain batteries and drop frames there).
  const touch = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
  let raw: unknown = null;
  try { raw = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? 'null'); } catch { /* blocked or corrupt: defaults */ }
  current = parseSettings(raw, defaultSettings(reduce, touch));
  return current;
}

export function settings(): Settings {
  return current;
}

export function updateSettings(change: Partial<Settings>): Settings {
  current = parseSettings({ ...current, ...change }, current);
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* keep for this session */ }
  for (const l of listeners) l(current);
  return current;
}

export function onSettingsChange(listener: (s: Settings) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
