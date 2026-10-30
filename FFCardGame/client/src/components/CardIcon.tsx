import type { CardType } from '../game/types';

const paths: Record<CardType, string[]> = {
  strike: ['m21 43 7-13-7-5 8-12 18 10-5 10 5 5-10 13Z', 'm29 13 5 14 13-4M28 30l14 3M21 43l16 8M10 34l7-1M44 10l-2 6M49 43l6 4'],
  guard: ['m32 8 19 8v15c0 12-19 24-19 24S13 43 13 31V16Z', 'M32 15v32M20 21l12-5 12 5v10c0 7-12 16-12 16S20 38 20 31Z'],
  piston: ['m13 42 9-9 10 10-9 9ZM24 31l12-12 10 10-12 12M34 17l6-6 14 14-6 6M10 54l10-10M40 11l6-6M54 25l5-5M14 19l5 5M20 11l3 9'],
  vent: ['M13 46h38v8H13ZM20 40c-15-13 11-14-1-28M32 40c-15-13 11-14-1-28M44 40c-15-13 11-14-1-28'],
  shield: ['m32 8 20 9v16c0 12-20 22-20 22S12 45 12 33V17Z', 'M32 43c-16-9 0-23 0-23s-1 7 6 9c7 6 1 12-6 14ZM20 16l5 3M44 16l-5 3'],
  cycle: ['M48 22A19 19 0 0 0 15 20l-4 7M16 42a19 19 0 0 0 33 2l4-7M11 15v12h12M53 49V37H41M27 21l-5 13h10l-4 12 15-19H32l5-6Z'],
};

export function CardIcon({ type }: { type: CardType }) {
  return <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {paths[type].map((d, i) => <path key={i} d={d} />)}
  </svg>;
}
