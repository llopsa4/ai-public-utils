// Chapter pins are the controls. Details appear on hover/focus or the first touch tap.
import type { Chapter } from '../chapters/types';
import { MAP_SIZE, PLACES } from '../content/world';
import { t } from '../engine/i18n';
import { PAINTED, drawLand, el } from './journal';
import { mapPins, type MapPin } from './mapPins';
import { mapPinSelection, mapTooltipPosition } from './chapterMapInteraction';
import { $ } from './ui';
import './chapterMap.css';

export function showChapterMap(open: readonly Chapter[], played: readonly Chapter[] = []): Promise<Chapter> {
 const screen=$('chapter-map'),host=$('chapter-map-svg');
 document.getElementById('chapter-map-list')?.remove();
 return new Promise(resolve=>{
  const svg=el('svg',{viewBox:`0 0 ${MAP_SIZE.w} ${MAP_SIZE.h}`,class:'world-map chapter-pins',role:'group','aria-label':t('ui.chapterMapLabel')}) as SVGSVGElement;
  const tooltip=document.createElement('div');tooltip.id='chapter-map-tooltip';tooltip.className='chapter-map-tooltip';tooltip.hidden=true;tooltip.setAttribute('role','tooltip');
  if(PAINTED)svg.append(el('image',{href:PAINTED,x:0,y:0,width:MAP_SIZE.w,height:MAP_SIZE.h,'aria-hidden':'true'}));
  else drawLand(svg);
  let current:{pin:SVGGElement;data:MapPin}|null=null,touchPreview:string|null=null,finished=false;
  const nodes:SVGGElement[]=[];
  const hide=()=>{tooltip.hidden=true;current?.pin.removeAttribute('aria-describedby');current=null;};
  const position=()=>{
   if(!current||tooltip.hidden)return;
   const frame=host.getBoundingClientRect(),anchor=current.pin.querySelector('.map-here-pin')!.getBoundingClientRect();
   tooltip.style.maxWidth=`${Math.max(1,frame.width-16)}px`;
   const size=tooltip.getBoundingClientRect();
   const at=mapTooltipPosition(frame,{x:anchor.x-frame.x,y:anchor.y-frame.y,width:anchor.width,height:anchor.height},size);
   tooltip.style.left=`${at.x}px`;tooltip.style.top=`${at.y}px`;
  };
  const show=(pin:SVGGElement,data:MapPin)=>{
   current?.pin.removeAttribute('aria-describedby');current={pin,data};
   const location=document.createElement('strong');location.textContent=t(PLACES[data.ch.pin].name);
   const title=document.createElement('p');title.textContent=data.label;
   const date=document.createElement('p');date.textContent=data.played?t('ui.played'):data.day;
   const lines:HTMLElement[]=[location,title,date];
   if(data.earlier){const earlier=document.createElement('p');earlier.textContent=data.earlier;lines.push(earlier);}
   tooltip.replaceChildren(...lines);tooltip.hidden=false;pin.setAttribute('aria-describedby',tooltip.id);position();
  };
  const dismiss=(event:PointerEvent)=>{
   if(!(event.target instanceof Element&&event.target.closest('.chapter-pin'))){touchPreview=null;hide();}
  };
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){touchPreview=null;hide();}};
  const resize=()=>{
   const heading=screen.querySelector('h1')!.getBoundingClientRect(),style=getComputedStyle(screen);
   const available=screen.clientHeight-heading.height-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-parseFloat(style.rowGap||'0');
   host.style.maxWidth=`${Math.max(1,Math.floor(available*MAP_SIZE.w/MAP_SIZE.h))}px`;
   const scale=svg.getBoundingClientRect().width/MAP_SIZE.w;
   if(scale)for(const node of nodes)node.querySelector('.chapter-pin-hit')!.setAttribute('r',String(Math.max(24,22/scale)));
   position();
  };
  const observer=new ResizeObserver(resize);
  const fontsReady=()=>{if(!finished)resize();};
  const pick=(ch:Chapter)=>{
   finished=true;observer.disconnect();screen.removeEventListener('pointerdown',dismiss);screen.removeEventListener('keydown',escape);document.fonts?.removeEventListener('loadingdone',fontsReady);
   screen.hidden=true;host.replaceChildren();resolve(ch);
  };
  for(const data of mapPins(open,played)){
   const {ch,played:done}=data,at=PLACES[ch.pin];
   const pin=el('g',{class:`chapter-pin${done?' played':''}`,role:'button',tabindex:0,'aria-disabled':String(done),'aria-label':`${t(at.name)} · ${data.label} · ${done?t('ui.played'):data.day}`}) as SVGGElement;
   nodes.push(pin);
   pin.append(el('circle',{cx:at.x,cy:at.y-16,r:24,class:'chapter-pin-hit',fill:'transparent'}));
   if(!done)pin.append(el('circle',{cx:at.x,cy:at.y,r:18,class:'map-here-ring','aria-hidden':'true'}));
   pin.append(el('path',{d:`M${at.x},${at.y} l-11,-27 a12,12 0 1 1 22,0 z`,class:'map-here-pin','aria-hidden':'true'}));
   if(done)pin.append(el('path',{d:`M${at.x-6},${at.y-32} l4,5 l8,-10`,class:'pin-tick','aria-hidden':'true'}));
   let pointerType='mouse';
   pin.addEventListener('pointerdown',e=>{pointerType=e.pointerType;});
   pin.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch'){touchPreview=null;show(pin,data);}});
   pin.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&document.activeElement!==pin&&current?.pin===pin)hide();});
   pin.addEventListener('focus',()=>show(pin,data));
   pin.addEventListener('blur',()=>{if(current?.pin===pin&&touchPreview!==ch.id)hide();});
   pin.addEventListener('click',e=>{
    const input=e.detail===0?'keyboard':pointerType==='touch'?'touch':'pointer';
    const action=mapPinSelection(touchPreview,ch.id,done,input);
    touchPreview=input==='touch'?action.preview:null;
    if(action.activate)pick(ch);else show(pin,data);
   });
   pin.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!done)pick(ch);else show(pin,data);}
   });
   svg.append(pin);
  }
  host.replaceChildren(svg,tooltip);screen.hidden=false;screen.tabIndex=-1;screen.focus({preventScroll:true});
  screen.addEventListener('pointerdown',dismiss);screen.addEventListener('keydown',escape);
  observer.observe(host);observer.observe(screen);observer.observe(screen.querySelector('h1')!);resize();document.fonts?.addEventListener('loadingdone',fontsReady);void document.fonts?.ready.then(fontsReady);
 });
}
