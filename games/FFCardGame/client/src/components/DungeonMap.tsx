import { openingArt } from '../assets';
import { useId, useRef, useState } from 'react';
import { ROUTE_PREVIEW } from '../content/dungeon';
import { destinationEvent, nodeById, nodeStatus, type DungeonDefinition, type NodeKind } from '../game/dungeon';
import { FrameCorners } from './Ornaments';

const icons: Record<NodeKind,string> = {
  entry:'M6 17h12m-6-6 6 6-6 6M6 7h12', exit:'M6 23V5h15v18M10 23V9h7v14M19 15h1',
  battle:'m6 5 16 18m-1-18L6 23M4 17l7 7m7-8 7 7M6 5l4 1-3 3M21 5l-4 1 3 3',
  rest:'M7 18h16l-3 7h-10Zm8-15c5 5-4 6 1 10-7 1-8-4-1-10ZM8 27h14',
  discovery:'m15 3 10 12-10 12L5 15Zm0 5v14M8 15h14',
  workshop:'m7 24 13-17m-6-1 6-3 6 6-3 6Zm-9 8 5 4',
  teacher:'M4 7h8l3 3 3-3h8v17h-8l-3 3-3-3H4Zm11 3v17',
  story:'M5 25V9h6v16m8 0V9h6v16M3 25h24M7 5h2m12 0h2M11 15h8M11 20h8',
};
function RouteIcon({kind}:{kind:NodeKind}) {
  return <svg viewBox="0 0 30 30" aria-hidden="true" focusable="false"><path d={icons[kind]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
const statusText = {current:'You are here',visited:'Visited',reachable:'Available',missed:'Passed by',locked:'Locked'};

export function DungeonMap({path,complete,onTravel,functional=false,expanded=false,definition=ROUTE_PREVIEW}:{definition?:DungeonDefinition;path:readonly string[];complete:boolean;onTravel:(id:string)=>void;functional?:boolean;expanded?:boolean}) {
  const map=definition, rows=Math.max(...definition.nodes.map(node=>node.row))+1, marker=useId().replaceAll(':','');
  const nodes=[...map.nodes].sort((a,b)=>a.row-b.row||a.lane-b.lane);
  const [selected,setSelected]=useState(()=>nodes.find(n=>nodeStatus(map,path,n.id)==='reachable')?.id??path.at(-1)??map.start);
  const preview=useRef<HTMLElement>(null);
  const buttons=useRef(new Map<string,HTMLButtonElement>());
  const node=nodeById(map,selected)!;
  const status=nodeStatus(map,path,node.id);
  const current=nodeById(map,path.at(-1)??map.start)!;
  const alternatives=current.next.filter(id=>id!==selected).map(id=>nodeById(map,id)!.name);
  function inspect(id:string,scroll:boolean) {
    setSelected(id);
    if(scroll)preview.current?.scrollIntoView({block:'nearest',behavior:'instant'});
  }
  return <>
    {map.id==='first-delivery'&&<><p className="route-section-label">1 · Ashways → 2 · Hanging Approach</p><img className="route-place-thumb" src={current.row<6?openingArt.ashways:openingArt['hanging-crossing']} alt={current.row<6?'The ashways return pipes':'The hanging approach and crossing'}/></>}
    <p className="route-intro">Inspect a stop, then choose Travel. Branches you pass are left behind.</p>
    <div className="route-legend" aria-label="Route states"><span>◇ Available</span><span>◆ You are here</span><span>✓ Visited</span><span>— Passed by</span><span>· Locked</span></div>
    <div className="route-layout">
      <div className="route-canvas" style={rows!==7?{height:rows*100,minHeight:rows*100,aspectRatio:'auto',gridTemplateRows:`repeat(${rows},1fr)`}:undefined} role="group" aria-label="Connected kiln routes">
        <svg className="route-lines" viewBox={`0 0 600 ${rows*100}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <defs><marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="m0 0 8 4-8 4Z" fill="currentColor" /></marker></defs>
          {map.nodes.flatMap(from=>from.next.map(toId=>{
            const to=nodeById(map,toId)!;
            const traversed=path.some((id,index)=>id===from.id&&path[index+1]===toId);
            const available=from.id===path.at(-1)&&!complete;
            return <path key={`${from.id}-${toId}`} className={traversed?'traversed':available?'available':''} d={`M${100+from.lane*200} ${50+from.row*100+27} L${100+to.lane*200} ${50+to.row*100-32}`} markerEnd={`url(#${marker})`} />;
          }))}
        </svg>
        {nodes.map((stop,index)=>{
          const state=nodeStatus(map,path,stop.id), gate=map.gates.includes(stop.id);
          return <button key={stop.id} ref={element=>{if(element)buttons.current.set(stop.id,element);else buttons.current.delete(stop.id);}}
            data-kind={stop.kind} data-gate={gate || undefined} className={`route-node ${state}${selected===stop.id?' selected':''}`} style={{gridRow:stop.row+1,gridColumn:stop.lane+1}}
            tabIndex={selected===stop.id?0:-1} aria-current={state==='current'?'step':undefined} aria-pressed={selected===stop.id}
            aria-label={`${stop.name}. ${stop.kind}${gate?', mandatory gate':''}. ${statusText[state]}. Inspect stop.`}
            onFocus={()=>inspect(stop.id,false)} onClick={()=>inspect(stop.id,true)} onKeyDown={event=>{
              const direction=['ArrowRight','ArrowDown'].includes(event.key)?1:['ArrowLeft','ArrowUp'].includes(event.key)?-1:0;
              if(!direction&&event.key!=='Home'&&event.key!=='End')return;
              event.preventDefault();
              const target=nodes[event.key==='Home'?0:event.key==='End'?nodes.length-1:(index+direction+nodes.length)%nodes.length];
              inspect(target.id,false);buttons.current.get(target.id)?.focus();
            }}>
            <span className="route-node-icon"><RouteIcon kind={stop.kind}/></span><strong>{stop.name}</strong><small>{state==='visited'?'✓ ':state==='reachable'?'◇ ':''}{statusText[state]}{gate?' · Gate':''}</small>
          </button>;
        })}
      </div>
      <aside ref={preview} className="route-preview" aria-label="Selected stop preview">
        <FrameCorners/>
        <span className="eyebrow">{node.kind} {map.gates.includes(node.id)?'· FIXED GATE':''}</span>
        <h2>{node.name}</h2>
        <p className="route-state" role="status">{statusText[status]}</p>
        <dl><div><dt>Risk</dt><dd>{node.risk}</dd></div><div><dt>Reward category</dt><dd>{node.reward}</dd></div></dl>
        <p className="session-caption">{functional&&(['battle','rest','discovery','teacher'].includes(node.kind)||(expanded&&['workshop','story'].includes(node.kind)))?'Travel to review this encounter or choice.':'This destination remains a preview.'}</p>
        {status==='reachable'&&!complete ? <>
          {alternatives.length>0&&<p className="route-tradeoff">This choice leaves {alternatives.join(' and ')} behind.</p>}
          <button className="modal-primary" onClick={event=>{if(event.detail<=1)onTravel(node.id);}}>Travel to {node.name}</button>
        </> : <><p className="session-caption">{complete?'This route is recorded.':status==='missed'?'This branch was left behind.':status==='locked'?'Reach this stop through the connected path.':'Choose an available connected stop.'}</p><button className="session-secondary" disabled>Travel unavailable</button></>}
        <p className="route-keyboard">Arrow keys inspect stops. Tab reaches Travel.</p>
      </aside>
    </div>
  </>;
}

const destinationText:Record<NodeKind,string>={
  entry:'The path opens into the kiln.',battle:'A machine encounter will occupy this stop.',rest:'This quiet hearth marks a future recovery stop.',
  discovery:'A future discovery will offer a brief choice here.',workshop:'This workbench marks a future equipment stop.',teacher:'Every route reaches this training gate.',
  story:'Every route meets again at this story gate.',exit:'You have reached the far door through your chosen route.',
};
export function DungeonDestination({nodeId,onContinue}:{nodeId:string;onContinue:()=>void}) {
  const event=destinationEvent(ROUTE_PREVIEW,nodeId), node=nodeById(ROUTE_PREVIEW,nodeId)!;
  return <section className="route-destination" aria-label={`${event.kind} destination preview`}>
    <div className="destination-emblem"><RouteIcon kind={event.kind}/></div>
    <span className="eyebrow">{event.kind} · {node.risk} risk</span>
    <h2>{node.name}</h2><p>{destinationText[event.kind]}</p>
    <p className="session-caption">Reward category: {node.reward}. Navigation preview only; your resources stay unchanged.</p>
    <button className="modal-primary" onClick={event=>{if(event.detail<=1)onContinue();}}>{event.kind==='exit'?'Finish route preview':'Continue route'}</button>
  </section>;
}
