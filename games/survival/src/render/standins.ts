// Whether the page asks for the grey stand-ins. Kept apart from atlases.ts (which holds the Vite file globs) so
// art.ts, and everything that imports it, still loads under the plain Node test runner.

let asked: boolean | undefined;

/** True when the page was opened with `?standins` on the dev server (read once: it is asked for every sprite, every frame). */
export function standinsOn(): boolean {
  asked ??= import.meta.env.DEV && new URLSearchParams(location.search).has('standins');
  return asked;
}
