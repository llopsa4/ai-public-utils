import type { Condition, HotspotDef, RoomDef, Verb } from '../../engine/types';
import { PERIODS, strings, text, type Period } from './data';
import { BOW_DRAW_SHEET } from './bow';

export interface TestProp { id:string; label:string; room:string; x:number;y:number; visibleIf:Condition[]; done?:string; person?:boolean }
export const TEST_PROPS:TestProp[]=[];
export const ROOMS:Record<string,RoomDef>={};
for(const [id,title] of Object.entries({tsalohi:'Tsalohi',camp:'Trail camp',river:'Riverbank',clearing:'Woodland clearing',forest:'Deep forest',hut:"Kofi’s hut"})){
 text(`room.${id}`,title);
 strings[`room.${id}`]=title;
 ROOMS[id]={id,background:`kofi-room-${id}`,surface:'ash',music:id==='forest'?'tension':'warm',
  walkable:{outer:[{x:8,y:305},{x:632,y:305},{x:632,y:350},{x:8,y:350}],holes:[]},
  scale:{farY:305,nearY:350,farScale:1,nearScale:1},entries:{start:{x:320,y:338,face:'up'}},
  actors:[],hotspots:[],objects:[],look:{vignette:0},
 };
}
ROOMS.camp.sheets=[BOW_DRAW_SHEET];
ROOMS.clearing.sheets=[BOW_DRAW_SHEET];
const counts:Record<string,number>={};
function target(room:string,id:string,label:string,periods:Period[],options:{verbs?:Verb[];if?:Condition[];done?:string;person?:boolean;slot?:number}={}){
 for(const period of periods){
  const group=`${room}:${period}`,n=options.slot??counts[group]??0;
  counts[group]=Math.max(counts[group]??0,n+1);
  const x=46+(n%8)*78,y=98+Math.floor(n/8)*61;
  const visibleIf=[...PERIODS[period],...(options.if??[])];
  const propId=`${id}-${period}`;
  const h:HotspotDef={id,name:text(`target.${room}.${period}.${id}`,label),polygon:[{x:x-34,y:y-24},{x:x+34,y:y-24},{x:x+34,y:y+8},{x:x-34,y:y+8}],
   verbs:options.verbs??['look','use','take'],walkTo:{x,y:325},visibleIf,outline:{objects:[propId]}};
  ROOMS[room].hotspots.push(h);
  ROOMS[room].objects.push({id:propId,sheet:`kofi-prop-${room}-${id}`,x,y:y+8,visibleIf,flag:options.done,whenTrue:'done',whenFalse:'idle'});
  TEST_PROPS.push({id,label,room,x,y:y+8,visibleIf,done:options.done,person:options.person});
 }
}
const people=(room:string,periods:Period[])=>{
 for(const p of ['oweli','saluna','tohani','ahyeli','enali','deyu'])
 target(room,p,p[0].toUpperCase()+p.slice(1),periods,{verbs:['look','talk'],person:true,
  if:p==='enali'?[{notFlag:'deyuSaved'}]:p==='deyu'?[{notFlag:'enaliSaved'}]:[]});
 target(room,'huska','Huska',periods,{verbs:['look','talk','use'],person:true});
};
people('tsalohi',['opening']);
target('tsalohi','gate','Tohani’s gate',['opening'],{done:'pinFitted'});
target('tsalohi','bell','Loose bell',['opening'],{if:[{flag:'pinFitted'},{notFlag:'bellTaken'}]});
target('tsalohi','cloth','Pot cloth',['opening'],{if:[{notFlag:'potLifted'},{lacks:'kofiCloth'}]});
target('tsalohi','pot','Hot pot',['opening'],{if:[{notFlag:'potLifted'}]});
target('tsalohi','trestle','Deyu’s trestle',['opening'],{done:'potDone'});
target('tsalohi','coop','Chicken coop',['opening','disaster'],{verbs:['look','open','close','use'],done:'coopClosed'});
target('tsalohi','scoop','Grain scoop',['opening'],{if:[{notFlag:'chickenDone'},{lacks:'kofiGrain'}]});
target('tsalohi','hook','Scoop hook',['opening'],{done:'chickenDone'});
target('tsalohi','inland','Inland gate',['opening','disaster'],{verbs:['look','go']});
target('tsalohi','enaliRescue','Enali — left ledge',['disaster'],{verbs:['look','talk']});
target('tsalohi','deyuRescue','Deyu — right ledge',['disaster'],{verbs:['look','talk']});
people('camp',['camp']);
target('camp','deadBough','Dry stick caught in a dead bough',['camp'],{verbs:['look','use'],done:'branchLoose'});
target('camp','branch','Dislodged dry branch',['camp'],{if:[{flag:'branchLoose'},{notFlag:'brandLit'},{lacks:'kofiBranch'}]});
target('camp','herd','Herd in the dark',['camp'],{done:'herdGathered'});
target('camp','fire','Cook fire',['camp'],{done:'brandLit'});
target('camp','trail','Trail at dawn',['camp'],{verbs:['look','go']});

people('river',['water','building','rite','settlement','hunt']);
for(const [id,label] of Object.entries({mud:'Muddy intake',seep:'Upper seep',trough:'Salvaged trough',bundle:'Communal bundle',tracks:'Uphill goat tracks',leaves:'Leaves over the inflow',twig:'Fallen twig',shore:'Flat shore stones',screen:'Reed grit screen',pot:'Shared cook pot',fire:'Cook fire'}))
 target('river',id,label,['water'],{done:({seep:'troughPlaced',leaves:'leavesCleared',trough:'stripsFitted',fire:'waterDone'} as Record<string,string>)[id],if:[...(['twig','screen','trough','pot'].includes(id)?[{lacks:`kofi${id[0].toUpperCase()+id.slice(1)}`}]:[]),...(id==='trough'?[{notFlag:'troughPlaced'}]:id==='screen'?[{notFlag:'screenFitted'}]:[])]});
for(const [id,label] of Object.entries({sheath:'Axe sheath',search:'Trampled reeds',axe:'Exposed axe',mature:'Mature reeds',young:'Young reeds',clay:'Bank clay',sledge:'Hauling sledge',browse:'Cut leafy browse',bowl:'Feed bowl',lead:'Nanny’s lead rope',frame:'Ground-hut reed wall',mix:'Clay mixing hollow',washing:'Washing-water pot',cord:'Light cord',rack:'Communal tools'}))
 target('river',id,label,['building'],{done:({sledge:'sledgeMoved',frame:'wallDone',bowl:'bowlFilled'} as Record<string,string>)[id],if:id==='axe'?[{flag:'axeExposed'},{notFlag:'axeFound'}]:id==='sheath'?[{notFlag:'axeFound'},{lacks:'kofiSheath'}]:id==='cord'?[{notFlag:'cordTaken'}]:[]});
target('river','toClearing','Path to woodland clearing',['building','rite','settlement','hunt'],{verbs:['look','go']});
for(const [id,label] of Object.entries({riteStone:'Smooth river stone',riverOffering:'River offering space',treeOffering:'Tree offering space',animalOffering:'Animals offering space',homeOffering:'Old-home offering space',circle:'Founding circle'}))
 target('river',id,label,['rite'],{done:({riverOffering:'stonePlaced',treeOffering:'branchPlaced',animalOffering:'featherPlaced',homeOffering:'bellPlaced'} as Record<string,string>)[id],if:id==='riteStone'?[{notFlag:'stonePlaced'},{lacks:'kofiRiteStone'}]:[]});
for(const [id,label] of Object.entries({garden:'Bitten garden shoots',gap:'Watering path gap',gardenPlan:'Propose a garden agreement',watchPlan:'Propose a watch agreement',hutPlan:'Propose a hut agreement',lateVolunteer:'Late-watch volunteer',waterVolunteer:'Water-round volunteer',breakfastVolunteer:'Breakfast volunteer',doors:'Ground-home doors',rack:'Communal supply rack'}))
 target('river',id,label,['settlement'],{verbs:id==='rack'?['look','take','use']:['look',id.includes('Volunteer')?'talk':'use'],done:id==='gap'?'gardenDone':id==='doors'?'bracesFitted':undefined});
target('river','rack','Hunting kit / go hunting',['hunt'],{verbs:['look','use']});
people('clearing',[]);
for(const [id,label] of Object.entries({fork:'High branch fork',bark:'Loose bark on fallen timber',board:'Work board',rig:'Hanging line',cradle:'Beam cradle'}))
 target('clearing',id,label,['building'],{done:({fork:'lineHung',rig:'ropeHung',cradle:'beamLifted',bark:'barkCut'} as Record<string,string>)[id]});
target('clearing','platform','Low tree platform',['rite'],{verbs:['look','use','take'],if:[{notFlag:'branchTaken'}]});
for(const [id,label] of Object.entries({board:'Watch board and charcoal',ladder:'Family ladder',practice:'Ahyeli and children — practice',refuge:'Shared refuge hut'}))
 target('clearing',id,label,['settlement'],{done:id==='board'?'watchDone':id==='ladder'?'handRopeFitted':id==='practice'?'hutsDone':undefined});
target('clearing','toRiver','Path to riverbank',['building','rite','settlement','hunt'],{verbs:['look','go']});
target('clearing','toForest','Deep-forest trail',['building','rite','settlement','hunt'],{verbs:['look','go']});
target('forest','huska','Huska by the log',['hunt'],{verbs:['look','talk'],person:true});
for(const [id,label] of Object.entries({tracks:'Fresh bear tracks',brush:'Torn brush',log:'Fallen log',limb:'Blocking side limb',vine:'Rotten binding vine'}))
 target('forest',id,label,['hunt'],{done:id==='limb'?'laneClear':id==='vine'?'vineCut':undefined,if:id==='vine'?[{flag:'vineSeen'},{notFlag:'vineCut'}]:[]});
target('forest','return','Return to Amaneti',['hunt'],{verbs:['look','go']});
for(const [id,label] of Object.entries({beam:'Shifted roof beam',sill:'Stone beam sill',pole:'Short levering pole',wedge:'Wooden support wedge',nets:'Drying nets',drawcord:'Net drawcord',stool:'Robot beneath stool',gap:'Dry hearth gap',bedroll:'Bedroll — sit back',arrow:'Recovered arrow',shelf:'Low arrow shelf',hearth:'Cold hearth',rack:'Door rack'}))
 target('hut',id,label,['home'],{done:id==='beam'?'beamSupported':id==='nets'?'robotFreed':id==='shelf'?'arrowShelved':undefined,
 if:id==='pole'?[{notFlag:'robotFreed'},{lacks:'kofiPole'}]:id==='wedge'?[{notFlag:'beamSupported'},{lacks:'kofiWedge'}]:id==='stool'?[{flag:'robotFreed'},{notFlag:'arrowRetrieved'}]:id==='arrow'?[{flag:'arrowRetrieved'},{notFlag:'arrowTaken'}]:[]});

// Persistent scenery stays separate from targets and survives revisits and save reloads.
function visual(room:string,id:string,label:string,x:number,y:number,visibleIf:Condition[]){
 TEST_PROPS.push({room,id,label,x,y,visibleIf});
 ROOMS[room].objects.push({id:`visual-${id}`,sheet:`kofi-prop-${room}-${id}`,x,y,visibleIf,anim:'idle'});
}
visual('river','waterPoint','Installed water point',92,284,[{flag:'waterDone'}]);
visual('river','groundHomes','Ground homes',250,284,[{flag:'built'}]);
visual('river','gardens','Growing gardens',410,284,[{flag:'riteDone'}]);
visual('river','riteCircle','Founding offerings',565,284,[{flag:'riteSpoken'}]);
visual('clearing','firstPlatform','Completed low platform',100,284,[{flag:'built'}]);
visual('clearing','familyHut','Family tree hut',255,284,[{flag:'riteDone'}]);
visual('clearing','sharedRefuge','Shared tree refuge',410,284,[{flag:'riteDone'}]);
visual('clearing','watchShelter','Watch shelter',565,284,[{flag:'riteDone'}]);
visual('hut','supportedWedge','Installed beam wedge',46,141,[{flag:'beamSupported'}]);
visual('hut','returnedPole','Pole by hearth',170,284,[{flag:'robotFreed'}]);
visual('hut','littleMachine','Little machine',520,284,[{flag:'robotFreed'}]);
ROOMS.hut.objects.at(-1)!.movedTo={flag:'arrowRetrieved',x:330,y:284};
