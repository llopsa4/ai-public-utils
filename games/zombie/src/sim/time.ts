// The fixed simulation rate, in its own module so base.ts and mission.ts can import each other's
// neighbours (ai, combat, abilities) without an import cycle.
export const TICK_HZ = 10;
