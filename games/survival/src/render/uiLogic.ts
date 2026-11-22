// The pure part of the interface surfaces (no Phaser, so a test can import it): which frame a surface shows.

export type SurfaceKind = 'panel' | 'button' | 'bar';
/** `active` is a toggled-on button or an armed panel; `disabled` a button that cannot be used now. */
export type Look = 'normal' | 'active' | 'disabled';

export const KEY: Record<SurfaceKind, string> = { panel: 'ui_panel', button: 'ui_button', bar: 'ui_bar_frame' };

/** The frame a surface shows for a look and pointer state (pure, for tests): a button has four states, the rest one. */
export function surfaceFrame(kind: SurfaceKind, look: Look, over: boolean, down: boolean): string {
  if (kind !== 'button') return KEY[kind];
  const state = look === 'disabled' ? 'disabled' : look === 'active' || down ? 'pressed' : over ? 'hover' : 'normal';
  return `ui_button/${state}`;
}

