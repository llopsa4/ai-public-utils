import type { CSSProperties } from 'react';

// Fixed-size, inert decoration: no particles, timers or campaign state accumulate.
export function Atmosphere({combat=false}:{combat?:boolean}) {
  return <div className={`atmosphere${combat?' arena-atmosphere':''}`} aria-hidden="true">
    <span className="kiln-light"/>
    {[12,28,43,61,77,88].map((left,index)=><i key={left} className="ambient-ember" style={{left:`${left}%`,'--drift':`${index%2?9:-7}px`,animationDelay:`-${index*.73}s`} as CSSProperties}/>)}
    <span className="ambient-steam"/>
  </div>;
}
