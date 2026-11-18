// Hero stats (DESIGN-m1.md section 2). Base values; a hero's twist and later items and helpers add to them.

export const STAT_BASE = {
  maxHp: 15, regen: 0, melee: 0, ranged: 0, dmgPct: 0, atkSpdPct: 0, critPct: 0,
  range: 0, armour: 0, dodgePct: 0, speedPct: 0, luck: 0, gather: 0, pickupRange: 0,
};

/** A fresh stat block for a hero definition from data/heroes.json (hp starts full). */
export function makeStats(heroDef) {
  const stats = { ...STAT_BASE };
  for (const [key, value] of Object.entries(heroDef.stats ?? {})) stats[key] += value;
  stats.hp = stats.maxHp;
  return stats;
}

/** Move speed in px per second: base speed x (1 + speedPct/100), never below half the base. */
export function moveSpeed(stats, rules) {
  return Math.max(rules.hero.speed * 0.5, rules.hero.speed * (1 + stats.speedPct / 100));
}

/** Display name and unit of each stat (shown on cards and in the shop's stats panel). */
export const STAT_INFO = {
  maxHp: ['Health', ''], regen: ['Mending', ''], melee: ['Melee', ''], ranged: ['Ranged', ''],
  dmgPct: ['Damage', '%'], atkSpdPct: ['Attack speed', '%'], critPct: ['Crit', '%'], range: ['Range', ''],
  armour: ['Armour', ''], dodgePct: ['Dodge', '%'], speedPct: ['Speed', '%'], luck: ['Luck', ''],
  gather: ['Gathering', ''], pickupRange: ['Reach', ''],
};

/** "+6% Dodge" or "−1 Armour". */
export function fmtDelta(key, value) {
  const [name, unit] = STAT_INFO[key];
  return `${value < 0 ? '−' : '+'}${Math.abs(value)}${unit} ${name}`;
}
