/** The intro's story flags and items (Silas's escape from Ironhaven's cells). Saves accept only these. */
export const FLAGS = [
  // the cell in the dark, then lit
  'shouted', 'tookPlate', 'cellLit',
  // what Silas finds and reads
  'tookNail', 'tookStrip', 'gotFrame', 'sawHarrow', 'readGuard', 'tookPlaster', 'harrowMade', 'wearingHarrow',
  // the guard, as Sergeant Harrow
  'guardAwake', 'gSus1', 'gSus2', 'gSus3', 'gotKeys', 'guardGone', 'harrowCracked', 'cellOpen',
  // the guardroom
  'sawWarden', 'readWarden', 'tookHood', 'tookLedger', 'clerkMade', 'wearingClerk',
  'wSus1', 'wSus2', 'wSus3', 'wardenBusy', 'grateOpen',
  // the outer door
  'metSigrid',
] as const;

export const SECRET_FLAGS = [] as const;
export const MET_FLAGS = [] as const;

export const ITEMS = [
  'plate', 'crust', 'nail', 'strip', 'hookLine', 'frame', 'plaster', 'wetPlaster', 'putty', 'maskHarrow', 'keys',
  'hood', 'ledger', 'maskClerk',
] as const;

/** Nothing of Silas's goes on to Mara's chapters (each hero keeps their own satchel). */
export const KEPT_ITEMS: readonly string[] = [];
