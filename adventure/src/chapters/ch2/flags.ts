/** Chapter 2's story flags and items. Saves accept only these for chapter 2. */
export const FLAGS = [
  // the tunnels: the grate, the steam junction (the wrong valve scalds), the cistern's bridge
  'grateOpen', 'foundRag', 'tunnel1Clear', 'grumbled', 'scalded', 'steamOff', 'tunnel2Clear', 'bridgeDown', 'tunnel3Clear',
  // the road
  'knocked',
  // the workshop
  'metBryn', 'offeredPractice', 'sparred', 'toldRush', 'toldHome', 'toldAlone', 'namedNeed', 'retuned', 'recordsRead',
  // the back room
  'ate', 'rested', 'letterSent', 'askedForHelp', 'sawValley',
  // optional secrets (none gate progress)
  'secretDoorframe', 'secretCrucible',
] as const;

export const SECRET_FLAGS = ['secretDoorframe', 'secretCrucible'] as const;

/** No background people in this chapter. */
export const MET_FLAGS = [] as const;

/** Chapter 1's items carry on. */
export const ITEMS = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf', 'rag'] as const;

/** What a fresh start of this chapter hands Mara (debug jumps; the chapter change keeps his own). */
export const START_ITEMS: readonly string[] = ['gauntlet', 'notebook', 'regulator'];

/** Items Mara keeps when the chapter ends. */
export const KEPT_ITEMS: readonly string[] = ['gauntlet', 'notebook', 'regulator', 'bread', 'scarf'];
