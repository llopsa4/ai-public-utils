// Cinderfold's stand-in for Kiln Courier's client/src/assets.ts (swapped in by vite.config.ts):
// the battle art as the small WebPs made by art/kc.mjs (art/src/kc), so Kiln Courier's full-size
// PNGs never enter the adventure. Only what this chapter's fight and workshop show; the compiler
// checks the names against the original.
import type * as Original from '@kc/assets';
import hero from '../../art/src/kc/hero.webp';
import pressure_scavenger from '../../art/src/kc/pressure-scavenger.webp';
import regulator_gallery from '../../art/src/kc/regulator-gallery.webp';
import cardAtlas from '../../art/src/kc/card-atlas.webp';

// The page icon is the adventure's own (the battle screen gets `brand`, which leaves it out).
export const assets = { hero, guardian: pressure_scavenger, mark: '', cardAtlas } satisfies Record<keyof typeof Original.assets, string>;

// Only keys Kiln Courier has (the compiler checks); pictures this chapter never shows are left out.
export const openingArt: Record<string, string> = {
  'pressure-scavenger': pressure_scavenger, 'ash-sweeper': pressure_scavenger, 'cable-warden': pressure_scavenger,
  'regulator-gallery': regulator_gallery, 'ashways': regulator_gallery, 'tempering-house': regulator_gallery, 'hanging-crossing': regulator_gallery,
  'iven': hero,
} satisfies Partial<Record<keyof typeof Original.openingArt, string>>;
