type StorageAccess = () => Pick<Storage, 'getItem' | 'setItem'> | undefined;

export const TUTORIAL_KEY = 'kiln-courier.tutorial-complete.v1';

// Obtain storage inside the try block: even accessing localStorage can throw.
export function tutorialComplete(storage: StorageAccess = () => globalThis.localStorage) {
  try { return storage()?.getItem(TUTORIAL_KEY) === 'true'; }
  catch { return false; }
}

export function completeTutorial(storage: StorageAccess = () => globalThis.localStorage) {
  try { storage()?.setItem(TUTORIAL_KEY, 'true'); }
  catch { /* This session can continue without persistence. */ }
}
