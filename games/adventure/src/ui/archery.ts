import { ARCHERY_ACTIONS, actionAvailable, archeryTurn, intent, newArchery, type Wildlife } from '../combat/archery';
import { BOW_DRAW_HOLD_MS } from '../chapters/kofi1/bow';
import drawnBow from '../../art/src/kofi1-test/kofi-test-bow-drawn.png';
import restingKofi from '../../art/src/kofi1-test/kofi-test-travel.png';
import './archery.css';

/** Functional card strip with simple CSS shapes only. No finished Kofi/animal/card art. */
export function mountArchery(host:HTMLElement,animal:Wildlife,onWin:()=>void,onMenu:()=>void):()=>void{
 let state=newArchery(animal);
 let drawing=false,closed=false,timer:number|undefined;
 const names={shot:'Shot',aim:'Aimed shot',step:'Step back',fire:'Fire brand',huska:'Huska!',gather:'Gather arrows'};
 const descriptions={shot:'1 arrow · 5 threat',aim:'2 turns · 1 arrow · 11 threat. Another card cancels setup.',step:'Block 9 · no arrows needed',fire:'2 stamina · cancel the next attack',huska:'2 threat · distract · rests for one turn',gather:'Recover spent arrows · block 4'};
 const root=document.createElement('section');root.className='archery-test';root.setAttribute('role','dialog');root.setAttribute('aria-label',animal==='bear'?'Bear encounter':'Wolf pack encounter');host.append(root);
 const render=()=>{
  root.replaceChildren();
  const heading=document.createElement('h2');heading.textContent=animal==='bear'?'Bear — make room to withdraw':'Wolf pack — hold the firelight';root.append(heading);
  const figures=document.createElement('div');figures.className='archery-figures';
  const fighter=document.createElement('span');fighter.className='archery-kofi';fighter.setAttribute('role','img');
  const drawn=drawing||state.outcome==='active'&&state.aiming;
  fighter.setAttribute('aria-label',drawn?'Kofi holding a tensed bow':'Kofi resting his bow');
  if(drawn){fighter.classList.add('bow-drawn');fighter.style.backgroundImage=`url("${drawnBow}")`;}
  else{const rest=document.createElement('img');rest.src=restingKofi;rest.alt='';fighter.append(rest);}
  const others=document.createElement('span');others.textContent=`◆ Huska     ${animal==='bear'?'▰ Bear':'◆ ◆ ◆ Wolves'}`;
  figures.append(fighter,others);root.append(figures);
  const stats=document.createElement('p');stats.textContent=`Health ${state.hp}/32 · Threat ${state.threat} · Arrows ${state.arrows} (${state.spent} spent) · Stamina ${state.stamina}/3`;root.append(stats);
  const next=document.createElement('strong');next.textContent=state.outcome==='active'?`Next: ${intent(state).name} (${intent(state).damage})${state.aiming?' · AIMED SHOT READY':''}`:state.outcome==='won'?'Immediate danger stopped. The aftermath choice follows.':'Kofi falls back. Retry the encounter; the cleared lane and earlier choices are kept.';root.append(next);
  const log=document.createElement('p');log.setAttribute('aria-live','polite');log.textContent=state.log;root.append(log);
  if(animal==='wolves'&&state.turn<2){const lesson=document.createElement('p');lesson.textContent='Shot spends an arrow. Step back blocks. Read the announced attack before choosing. Gather arrows works without landing a hit.';root.append(lesson);}
  const cards=document.createElement('div');cards.className='archery-cards';root.append(cards);
  for(const a of ARCHERY_ACTIONS){const b=document.createElement('button');b.type='button';b.disabled=drawing||!actionAvailable(state,a);b.textContent=`${names[a]}${a==='aim'&&state.aiming?' — release':''}`;const d=document.createElement('small');d.textContent=descriptions[a];b.append(d);b.onclick=()=>{
   if(drawing||!actionAvailable(state,a))return;
   if(a==='shot'||a==='aim'&&state.aiming){
    drawing=true;render();
    timer=window.setTimeout(()=>{if(closed)return;drawing=false;state=archeryTurn(state,a);render();},BOW_DRAW_HOLD_MS);
   }else{state=archeryTurn(state,a);render();}
  };cards.append(b);}
  if(state.outcome!=='active'){const button=document.createElement('button');button.type='button';button.textContent=state.outcome==='won'?'Continue':'Retry';button.onclick=()=>{if(state.outcome==='won')onWin();else{state=newArchery(animal);render();}};root.append(button);button.focus();}
  const menu=document.createElement('button');menu.type='button';menu.textContent='Menu';menu.onclick=onMenu;root.append(menu);
 };
 render();return ()=>{closed=true;if(timer!==undefined)window.clearTimeout(timer);root.remove();};
}
