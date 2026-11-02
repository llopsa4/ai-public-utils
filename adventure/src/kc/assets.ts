// Cinderfold: Kiln Courier's battle art, as the small WebPs made by art/kc.mjs (art/src/kc).
// Only what this chapter's fight and workshop show; other entries fall back to the card atlas.
import hero from '../../art/src/kc/hero.webp';
import pressure_scavenger from '../../art/src/kc/pressure-scavenger.webp';
import regulator_gallery from '../../art/src/kc/regulator-gallery.webp';
import cardAtlas from '../../art/src/kc/card-atlas.webp';

export const assets = { hero, guardian: pressure_scavenger, cardAtlas };

export const openingArt: Record<string, string> = {
  'pressure-scavenger': pressure_scavenger, 'ash-sweeper': pressure_scavenger, 'cable-warden': pressure_scavenger,
  'regulator-gallery': regulator_gallery, 'ashways': regulator_gallery, 'tempering-house': regulator_gallery, 'hanging-crossing': regulator_gallery,
  'iven': hero,
};
