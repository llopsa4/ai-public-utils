import { assets, openingArt } from '../assets';
import type { CardArtType, RewardCardType } from '../game/types';

export type ArtType = CardArtType | RewardCardType | 'draw-back' | 'discard-back';
const positions: Record<CardArtType | 'draw-back' | 'discard-back', string> = {
  strike: '0% 0%', guard: '50% 0%', pulse: '100% 0%',
  vent: '0% 50%', cycle: '50% 50%', piston: '100% 50%',
  shield: '0% 100%', 'draw-back': '50% 100%', 'discard-back': '100% 100%',
};

export function CardArt({ type, className = '' }: { type: ArtType; className?: string }) {
  const illustration=Object.hasOwn(openingArt,type)?openingArt[type as RewardCardType]:null;
  return <span aria-hidden="true" className={`card-art ${className}`}>
    <span className="card-art-tile" style={illustration?{backgroundImage:`url(${illustration})`,backgroundSize:'cover',backgroundPosition:'center'}:{ backgroundImage: `url(${assets.cardAtlas})`, backgroundPosition: positions[type as keyof typeof positions] }} />
  </span>;
}
