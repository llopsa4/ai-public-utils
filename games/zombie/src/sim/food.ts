import base from '../data/base1.json';

// DESIGN §12, §25 (user, 2026-11-26): any food mechanic is hidden until the main camp, Ray's hut. Every scene built so
// far comes before it, so one switch covers them all; the hut's design unit decides how food turns on there. What
// Mission 1 crates hold is still counted and saved, unseen.
export const FOOD_SHOWN: boolean = base.food;
