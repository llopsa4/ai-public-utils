import { StoryDetails } from './StoryDetails';
import { useLayoutEffect, useRef } from 'react';
import { sceneDefinition } from '../content/scenes';
import type { CampaignState, CampaignCommand } from '../game/campaign';
import { assets, openingArt } from '../assets';

export function ScenePlayer({state,dispatch}:{state:CampaignState;dispatch:(command:CampaignCommand)=>unknown}) {
  const scene=state.systems!.scene!,data=sceneDefinition(scene.id,!!state.systems!.opening),heading=useRef<HTMLHeadingElement>(null);
  useLayoutEffect(()=>{heading.current?.focus();},[scene.id,scene.beat]);
  const place=scene.id==='home'?openingArt.cinderfold:scene.id==='regulator'?openingArt['regulator-gallery']:scene.id==='ashways'?openingArt.ashways:scene.id==='oren'||scene.id==='hope'?openingArt['tempering-house']:openingArt['hanging-crossing'];
  const portrait=scene.id==='oren'||scene.id==='hope'?openingArt.oren:scene.id==='crossing'||scene.id==='partnership'?openingArt.iven:assets.hero;
  const person=portrait===openingArt.oren?'Oren':portrait===openingArt.iven?'Iven':'Mara';
  const final=(scene.beat+1)*2>=data.lines.length;
  return <section className="scene-player" aria-label={scene.replay?'Scene replay':'Story scene'}>
    <div className="scene-illustration" style={{backgroundImage:`linear-gradient(0deg,#110c07aa,transparent),url(${place})`}}><img src={portrait} alt={`Portrait of ${person}: ${data.title}.`}/><span>{scene.replay?'REPLAY · NO REWARDS':'KILN COURIER'}</span></div>
    <div className="scene-dialogue"><h2 ref={heading} tabIndex={-1}>{data.title}</h2><div className="scene-lines" aria-live="polite">{data.lines.slice(scene.beat*2,scene.beat*2+2).map(([speaker,line],index)=><p key={`${scene.beat}-${index}`}><strong>{speaker}</strong><span>{line}</span></p>)}</div>
      {scene.id==='regulator'&&<StoryDetails kind="regulator"/>}{scene.id==='hope'&&!!state.systems!.opening&&<StoryDetails kind="trace"/>}
      <p className="session-caption">{scene.beat+1} / {Math.ceil(data.lines.length/2)}</p><div className="session-actions"><button className="modal-primary" onClick={event=>{if(event.detail<=1)dispatch({type:'scene-next',revision:state.revision});}}>{final?(scene.replay?'Finish replay':data.action):'Continue'}</button><button className="quiet" onClick={event=>{if(event.detail<=1)dispatch({type:'scene-skip',revision:state.revision});}}>{scene.replay?'Close replay':'Skip scene'}</button></div>
    </div>
  </section>;
}
