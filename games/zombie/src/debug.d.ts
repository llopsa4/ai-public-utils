// The debug hook the Intro, Mission and Base scenes install as `window.dw` when the page is opened
// with `?debug` (used by tests/e2e and by hand in the browser console). `state` is the scene's sim state.
interface DeadWoodsDebug {
  state: { tick: number } & Record<string, unknown>;
  step(ticks: number): void;
  orders?(list: unknown[]): void;
  say?(lines: unknown[]): void;
}

interface Window {
  dw?: DeadWoodsDebug;
}
