import { useLayoutEffect, useRef } from 'react';
import { SCENES } from '../content/scenes';
import type { CampaignState, CampaignCommand } from '../game/campaign';
import { assets } from '../assets';

export function ScenePlayer({state,dispatch}:{state:CampaignState;dispatch:(command:CampaignCommand)=>unknown}) {
  const scene=state.systems!.scene!,data=SCENES[scene.id],heading=useRef<HTMLHeadingElement>(null);
  useLayoutEffect(()=>{heading.current?.focus();},[scene.id,scene.beat]);
  const final=(scene.beat+1)*2>=data.lines.length;
  return <section className="scene-player" aria-label={scene.replay?'Scene replay':'Story scene'}>
    <div className="scene-illustration"><img src={assets.hero} alt="Mara, carrying the pressure gauntlet through the kiln."/><span>{scene.replay?'REPLAY · NO REWARDS':'KILN COURIER'}</span></div>
    <div className="scene-dialogue"><h2 ref={heading} tabIndex={-1}>{data.title}</h2><div className="scene-lines" aria-live="polite">{data.lines.slice(scene.beat*2,scene.beat*2+2).map(([speaker,line],index)=><p key={`${scene.beat}-${index}`}><strong>{speaker}</strong><span>{line}</span></p>)}</div>
      <p className="session-caption">{scene.beat+1} / {Math.ceil(data.lines.length/2)}</p><div className="session-actions"><button className="modal-primary" onClick={event=>{if(event.detail<=1)dispatch({type:'scene-next',revision:state.revision});}}>{final?(scene.replay?'Finish replay':data.action):'Continue'}</button><button className="quiet" onClick={event=>{if(event.detail<=1)dispatch({type:'scene-skip',revision:state.revision});}}>{scene.replay?'Close replay':'Skip scene'}</button></div>
    </div>
  </section>;
}
