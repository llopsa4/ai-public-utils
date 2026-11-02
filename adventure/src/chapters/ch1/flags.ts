/** Chapter 1's story flags and items. Saves accept only these (per chapter). */
export const FLAGS = [
  // Mara's room
  'hasGauntlet', 'hasNotebook',
  // firing house
  'latchFixed', 'alarm', 'metNell', 'gotBread', 'gotScarf',
  // regulator gallery
  'metOren', 'patchFailed', 'toldRepair', 'toldMother', 'toldLeaving', 'toldWhyMe', 'decided', 'procedureKnown', 'kilnCold',
  // ashways
  'valveVented', 'sawSweeper',
  // optional secrets (none gate progress)
  'secretTally', 'secretChalk', 'secretSign', 'secretRail',
  // the first fight and what follows it
  'fought', 'gearChecked', 'metMerchant',
  // optional: background people Mara has talked to
  'metHollis', 'metWren', 'metDace', 'metAnsel', 'metPip', 'metBea',
] as const;

export const SECRET_FLAGS = ['secretTally', 'secretChalk', 'secretSign', 'secretRail'] as const;

/** Set the first time Mara talks to each background person (counted in the notebook). */
export const MET_FLAGS = ['metHollis', 'metWren', 'metDace', 'metAnsel', 'metPip', 'metBea'] as const;

export const ITEMS = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'] as const;

/** Items Mara keeps when the chapter ends (the rest stay behind). */
export const KEPT_ITEMS: readonly string[] = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'];
