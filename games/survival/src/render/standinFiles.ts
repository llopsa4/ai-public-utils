// The grey stand-in atlas files (art/standins/atlas/, git-ignored). Only the dev server uses this module: vite.config.ts
// swaps it for standinFiles.empty.ts in a build, so the published game never carries them.
export const standJson = import.meta.glob('../../art/standins/atlas/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;
export const standPng = import.meta.glob('../../art/standins/atlas/*.png', { eager: true, import: 'default', query: '?url' }) as Record<string, string>;
