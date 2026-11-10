// Backdrops behind the chapters' opening cards (art/intro-cards.mjs: crops of each chapter's first
// room), keyed by chapter id. Fetched only when that card is shown.
import ch1 from '../../art/src/intro-cards/ch1.webp';
import ch2 from '../../art/src/intro-cards/ch2.webp';
import intro from '../../art/src/intro-cards/intro.webp';

export const INTRO_CARDS: Record<string, string> = { intro, ch1, ch2 };
