// The interface font: Alegreya (SIL Open Font License; the licence text ships in node_modules/@fontsource/alegreya and
// is not art). Registered with the FontFace API before the game starts, so Phaser's text is measured with it.
import latin400 from '@fontsource/alegreya/files/alegreya-latin-400-normal.woff2?url';
import latin700 from '@fontsource/alegreya/files/alegreya-latin-700-normal.woff2?url';
import ext400 from '@fontsource/alegreya/files/alegreya-latin-ext-400-normal.woff2?url';
import ext700 from '@fontsource/alegreya/files/alegreya-latin-ext-700-normal.woff2?url';

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

/** Loads the regular and bold faces (Latin, plus Latin Extended for the Dakota letters). Never rejects: a failure keeps the fallback font. */
export async function loadFonts(): Promise<void> {
  if (typeof FontFace === 'undefined') return;
  const faces = [
    new FontFace('Alegreya', `url(${latin400}) format('woff2')`, { weight: '400', unicodeRange: LATIN }),
    new FontFace('Alegreya', `url(${ext400}) format('woff2')`, { weight: '400', unicodeRange: EXT }),
    new FontFace('Alegreya', `url(${latin700}) format('woff2')`, { weight: '700', unicodeRange: LATIN }),
    new FontFace('Alegreya', `url(${ext700}) format('woff2')`, { weight: '700', unicodeRange: EXT }),
  ];
  await Promise.all(
    faces.map(async (face) => {
      try {
        document.fonts.add(await face.load());
      } catch (error) {
        console.warn('Alegreya did not load; the fallback font is used.', error);
      }
    }),
  );
}
