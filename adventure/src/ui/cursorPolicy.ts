export type TargetCursorKind = 'look' | 'hand' | 'talk' | 'exit';
export type CursorKind = TargetCursorKind | 'default';

/** A carried item is a separate image beside the pointer; it never replaces the hand cue. */
export function sceneCursorKind(target: TargetCursorKind | null, carrying: boolean): CursorKind {
  return carrying ? 'hand' : target ?? 'default';
}
