import type { Command, GameState, Verb } from '../../engine/types';
import { conditionsHold } from '../../engine/geometry';
import { applyCommand } from '../../engine/state';
import { addStrings } from '../../engine/i18n';
import { ROOMS } from './rooms';
import { drawBow } from './bow';
import { I, add, all, card, choice, drop, f, go, has, line, menu, node, person, strings, talk } from './data';

const says=(id:string,t:string,who?:string)=>[line(id,t,who?person(who):'hero')];
const need=(s:GameState,flags:string[],id:string,words:string,then:()=>Command[])=>all(s,...flags)?then():says(id,words);
const collect=(s:GameState,id:string,words:string):Command[]=>has(s,id)?says(`held.${id}`,'I have that already.'):[add(id),...says(`take.${id}`,words)];
const combine=(item:string|undefined,target:string,a:string,b:string)=>item===I(a)&&target===`item:${I(b)}`||item===I(b)&&target===`item:${I(a)}`;
const inventoryCleanup=(s:GameState,keep:string[])=>s.inventory.filter(i=>!keep.map(I).includes(i)).map(item=>({type:'removeItem',item}) as Command);
const readyBow=(s:GameState):Command[]=>has(s,'bow')&&!s.flags.bowUnfolded?[f('bowUnfolded'),line('readyBow','Kofi unfolds the bow and checks the catch before the animals advance.',person('narrator'))]:[];
const readyOfferings=(s:GameState)=>all(s,'stonePlaced','branchPlaced','featherPlaced','bellPlaced');
const watchPeople=['watchTohani','watchSaluna','watchAhyeli','watchOweli','watchSurvivor','watchLate','watchWater','watchBreakfast'];
for(const who of ['enali','deyu'])menu(`campGrief${who}`,who==='enali'?"Deyu would have complained about this ground.":'Enali always said I sat too close to the fire.',[
 choice(who==='enali'?"He'd have built himself a bed.":'You do.','memory'),choice('Could I have—','question'),choice('Sit quietly',null),
],{
 memory:node(`campMemory.${who}`,who==='enali'?'And complained from there.':'Deyu moves his blanket a little.',who),
 question:node(`campQuestion.${who}`,'I was there, Kofi.',who),
},who);

for(const who of ['tohani','saluna','ahyeli','oweli','enali','deyu']){
 const garden=who==='tohani'?'gardenTohani':who==='saluna'?'gardenSaluna':undefined;
 const hut=who==='ahyeli'?'hutsAhyeli':who==='oweli'?'hutsOweli':who==='saluna'?'hutsSaluna':undefined;
 const watch=who==='enali'||who==='deyu'?'watchSurvivor':`watch${who[0].toUpperCase()+who.slice(1)}`;
 const gardenWords=who==='tohani'?"There's no browse left inside. Moving the pen makes the children carry water twice as far.":"Third morning. I need a garden I don't have to stand over.";
 const hutWords=who==='ahyeli'?"Height won't help if Tali has to carry Kanu down alone.":who==='oweli'?"I still have knees. I'd like to stay near the watch, on the ground.":"If the good doors all go above us, what are the rest of us getting?";
 const watchWords:Record<string,string>={tohani:'I can do early watch. Not every early watch.',saluna:'I need a night I can count on.',ahyeli:'If someone stays with the children, I can take an early turn.',oweli:'I can sit with them. Indoors.',enali:'Put me down. One night in three.',deyu:'Put me down. One night in three.'};
 menu(`concerns${who}`,'What is making the work difficult?',[
  ...(garden?[choice('The goats and garden','garden')]:[]),choice('The night watch','watch'),
  ...(hut?[choice('The ground and tree huts','huts')]:[]),
  ...(who==='ahyeli'?[choice('Will you practise the ladder with the children?','practice',[{flag:'hutsAgreed'}])]:[]),choice('Leave it for now',null),
 ],{
  ...(garden?{garden:node(`${who}.garden`,gardenWords,who,{[garden]:true})}:{}),
  watch:node(`${who}.watch`,watchWords[who],who,{[watch]:true}),
  ...(hut?{huts:node(`${who}.huts`,hutWords,who,{[hut]:true})}:{}),
  practice:node('ahyeli.practice','Yes. Ask Saluna to stand below. Fit a hand-rope before we try.','ahyeli',{practiceAsked:true}),
 });
}

/** Pure chapter logic. Each action returns commands; the scene and test driver apply them. */
function action(s:GameState,v:Verb,t:string,item?:string):Command[]{
 const use=v==='use',take=v==='take',look=v==='look',talking=v==='talk',F=s.flags;
 if(item&&!s.inventory.includes(item))return says('missingItem',"I don't have that with me.");
 if(t.startsWith('item:')){
  if(t===`item:${I('bow')}`&&!item&&use&&has(s,'bow'))return [f('bowUnfolded',!F.bowUnfolded),...says(F.bowUnfolded?'foldBow':'unfoldBow',F.bowUnfolded?'Unstring it, then fold the limbs flat beside the grip. Back along my leg.':'Open the limbs, check the catch, then string it. Ready.')];
  if(t===`item:${I('bow')}`&&look)return [line('bowLook','Deyu made this folding bow for me. Rough wood and leather hinges, with a catch to hold the limbs open.'),line(F.bowUnfolded?'bowOpenLook':'bowFoldedLook',F.bowUnfolded?'Open and ready. I can fold it away when the job is done.':'Folded for carrying. I need to open it before shooting.')];
  if(t===`item:${I('bluntArrow')}`&&look)return says('bluntLook','A round wooden head for knocking loose dry sticks and seedpods. Recover it after the shot.');
  if(combine(item,t,'strips','trough')&&F.enaliSaved&&!F.stripsFitted)return [drop('strips'),f('stripsFitted'),line('crossFeet','Across each other. Like the marks.')];
  if(combine(item,t,'cord','arrows')&&F.waterDone&&!F.built&&!F.lineHung)
   return [drop('cord'),add('lineArrow'),...says('tieArrow','Something light, first. The arrow stays mine.')];
  if(look)return says(`itemLook.${t}`,strings[`name.${t.slice(5)}`]??'A useful tool.');
  return says('itemWrong','Those do not fit together.');
 }
 if(s.room==='tsalohi'){
  if(F.warning){
   if(t==='coop'&&(v==='open'||use)&&!F.hensFreed)return [f('hensFreed'),add('bow'),add('arrows'),add('bluntArrow'),line('hensEscape','The catch is free. Ahyeli, take the baskets!'),line('rackGrab','Kofi takes his bow and quiver on the way inland.',person('narrator'))];
   if(t==='inland'&&v==='go')return F.hensFreed?[talk('rescue')]:says('coopFirst','The coop. Then out.');
   if(t==='enaliRescue')return says('enaliLedge','I can lift her end of the trestle. I have to get beside her.');
   if(t==='deyuRescue')return says('deyuLedge','His grip is going. I could reach him from that side.');
   return says('noOtherRescue',F.hensFreed?"One crossing. I can't reach both. Choose at the inland gate.":'The coop. Then out.');
  }
  if(t==='deyu'&&talking&&!F.pinGiven)return [f('pinGiven'),add('pin'),line('deyuPin','Keep it. Bring back a gate that works. A little boat for Kanu. No holes this time.',person('deyu')),line('deyuBoat','Ambitious.'),line('deyuChallenge','I like a challenge.',person('deyu'))];
  if(t==='enali'&&talking)return [f('clothAllowed'),line('potRequest','Could you bring the pot to the trestle? The cloth is for its handle.',person('enali'))];
  if(t==='ahyeli'&&talking)return [f('grainAllowed'),line('grainPermission','Borrow the scoop. Put it back when they are inside.',person('ahyeli'))];
  if(t==='gate'&&item===I('pin')&&!F.pinFitted)return [drop('pin'),f('pinFitted'),line('gateFixed','One small pin. A whole opinionated goat.'),line('bellPermission',"Put that bell somewhere. I'll mend the strap after supper.",person('tohani'))];
  if(t==='bell'&&take&&F.pinFitted&&!F.bellTaken)return [add('bell'),f('bellTaken'),f('gateDone'),line('bellTaken','Somewhere noisy.')];
  if(t==='cloth'&&take)return F.clothAllowed?collect(s,'cloth','Cloth first.'):says('askCloth','I should ask Enali.');
  if(t==='pot'&&item===I('cloth')&&!F.potLifted)return [drop('cloth'),add('hotPot'),f('potLifted'),line('liftPot','Still too hot for fingers.')];
  if(t==='pot'&&take)return says('hotHandle','Cloth first.');
  if(t==='trestle'&&item===I('hotPot')&&!F.potDone)return [drop('hotPot'),f('potDone'),line('enaliSit','Thank you. Sit down for a moment.',person('enali')),line('notStarted',"I haven't started work."),line('notThePot',"I wasn't asking for the pot. After supper, I'm going down to the water. The white birds are back.",person('enali')),line('savePlace','Save me a place.')];
  if(t==='scoop'&&take)return F.grainAllowed?collect(s,'grain','They follow the grain, not the person shouting.'):says('askGrain','I should ask Ahyeli.');
  if(t==='coop'&&item===I('grain')&&!F.coopClosed)return [f('hensInside'),line('hensInside','They listened to supper.')];
  if(t==='coop'&&v==='close')return F.hensInside?[f('coopClosed'),line('coopClosed','All inside. Now the scoop goes back.')]:says('hensOutside','They are still outside.');
  if(t==='hook'&&item===I('grain')&&F.coopClosed)return [drop('grain'),f('chickenDone')];
  if(t==='inland'&&v==='go')return says('errandsRemain',!F.gateDone?'The goat gate, and the loose bell.':!F.potDone?'Enali is waiting for the pot.':'Get the hens inside and put the scoop back.');
 }
 if(s.room==='camp'){
  if(t==='deadBough'&&look)return says('snagLook',F.branchLoose?'The dry stick is down. The rest of the dead bough can stay.':'A dry stick, caught above an empty patch of ground. A tap could free it.');
  if(t==='deadBough'&&item===I('bluntArrow')){
   if(F.branchLoose)return says('snagDone','It is down already. No need for another shot.');
   if(!has(s,'bow')||!F.bowUnfolded)return says('openBowFirst','Unfold the bow and check its catch first.');
   return [...drawBow(s,ROOMS.camp.hotspots.find(h=>h.id===t)!.walkTo!.x),f('branchLoose'),line('bluntShot','Kofi uses the round-headed arrow to knock the loose stick into the empty patch. He picks up his arrow before returning to the fire.',person('narrator')),line('usefulStick','A small job. Better than climbing a dead bough.')];
  }
  if(t==='deadBough'&&item===I('arrows'))return says('sharpAtSnag','The blunt head will knock it loose. A hunting point would stick in the wood.');
  if(talking&&(t==='enali'||t==='deyu')&&F.wolvesWon&&(F.wolfKilled||F.wolfReleased))return [talk(`campGrief${t}`)];
  if(t==='tohani'&&talking)return [talk('campPlan')];
  if(t==='branch'&&take)return collect(s,'branch','A stick. They have teeth.');
  if((t==='herd'&&use||t==='huska'&&talking)&&F.herdPlan&&!F.herdGathered)return [f('herdGathered'),line('gatherGoats','Bring them into the light, Huska.'),line('guardBaskets',"I've got the baskets.",person('tohani'))];
  if(t==='fire'&&item===I('branch')&&!F.brandLit)return [drop('branch'),add('brand'),f('brandLit'),line('lightBrand','Out by the herd.')];
  if(t==='trail'&&v==='go')return F.wolvesWon&&(F.wolfKilled||F.wolfReleased)?campDawn(s):F.wolvesWon?[talk('wolfAftermath')]:says('campNotReady','They need light, and the herd needs room.');
 }
 if(s.room==='river'){
  if(!F.waterDone){
   if(t==='mud'&&look)return [f('mudSeen'),line('mud','Everything stirred up upstream ends here.')];
   if(t==='seep'&&look)return [f('seepSeen'),line('seep','A little trickle over stone. We still need to check where it comes from.')];
   if(t==='tracks'&&(look||use)&&F.deyuSaved)return [f('tracksFollowed'),line('tracks','They have been climbing past the mud. The inflow is behind those leaves.')];
   if(t==='twig'&&take)return collect(s,'twig','A fallen twig will reach the leaves.');
   if(t==='leaves'&&item===I('twig'))return F.tracksFollowed?[f('leavesCleared'),line('clearLeaves','A separate run, over rock.')]:says('followTracksFirst','Follow the tracks to the inflow first.');
   if(t==='enali'&&talking)return need(s,['mudSeen','seepSeen'],'inspectWater','Look at the muddy intake and the upper trickle.',()=>[f('sourceChecked'),f('waterTalk'),line('enaliWater','The upper trickle is away from the churned bank. Bring the pots there. We still heat it.',person('enali'))]);
   if(t==='deyu'&&talking)return [f('waterTalk'),f('stripsFitted'),f('screenFitted'),line('deyuWater',"I can catch what comes down. Can't tell you what ought to be in it.",person('deyu'))];
   if(t==='saluna'&&talking)return need(s,['mudSeen','seepSeen','leavesCleared'],'showSource','Show me where it comes from.',()=>[f('sourceChecked'),line('salunaWater',"Better than the churned bank. We'll still heat it.",person('saluna'))]);
   if(t==='trough'&&look)return [f('troughSeen'),line('troughMarks','Two crossed slots. He made these to come apart.')];
   if(t==='trough'&&take)return F.waterTalk?collect(s,'trough','The communal trough.'):says('askTrough','Talk about the water before borrowing the frame.');
   if(t==='bundle'&&take&&F.enaliSaved)return F.troughSeen?collect(s,'strips','Two scrap foot strips match the wear marks.'):says('slotsFirst','The trough may show what is missing.');
   if(t==='trough'&&item===I('strips'))return has(s,'trough')?[drop('strips'),f('stripsFitted')]:says('takeTrough','Take the trough first.');
   if(t==='seep'&&item===I('trough'))return need(s,['sourceChecked','stripsFitted'],'standNotReady','Check the source and fit the crossed feet first.',()=>[drop('trough'),f('troughPlaced'),...(F.deyuSaved?[f('troughLevel')]:[line('wobbles',"One foot isn't touching.")])]);
   if(t==='shore'&&take)return collect(s,'stone','A flat stone. There are more along the shore.');
   if((t==='seep'||t==='trough')&&item===I('stone')&&F.troughPlaced)return [drop('stone'),f('troughLevel'),line('standLevel','Now it sits level.')];
   if(t==='screen'&&take&&F.enaliSaved&&!F.screenFitted)return collect(s,'screen','Loose reeds for catching grit.');
   if((t==='seep'||t==='trough')&&item===I('screen'))return need(s,['troughPlaced','troughLevel'],'levelFirst','Level the stand first.',()=>[drop('screen'),f('screenFitted')]);
   if(t==='pot'&&take)return collect(s,'pot','The drinking-water pot.');
   if(t==='seep'&&item===I('pot'))return need(s,['sourceChecked','troughPlaced','troughLevel','screenFitted'],'notReadyWater','The source, level stand and screen must be ready.',()=>[f('potFilled'),line('potFilled','Collected above the washing place. Now to heat it.')]);
   if(t==='fire'&&item===I('pot'))return need(s,['potFilled'],'rawWater','Upstream first.',()=>[f('waterDone'),...inventoryCleanup(s,['bell','bow','arrows','bluntArrow']),line('heatWater','Saluna tends the heated batch. Collection above, washing below.',person('narrator')),line('waterMemory',F.enaliSaved?"Deyu left the shape in the wood.":"Enali would have asked where we'd drawn it."),line('waterMarkers','Two separate stones mark collection and washing. The adults take over the next pots.',person('narrator'))]);
  }else if(!F.built){
   if(t==='saluna'&&talking){
    if(F.cradleTied&&F.sledgeMoved)return [f('helpersAgreed'),go('clearing')];
    return [f('axePermission'),line('axePermission',F.cradleTied?'Tohani needs the sledge unloaded before we can haul together.':'The axe is near those reeds. Huska keeps sniffing there.',person('saluna'))];
   }
   if(t==='sheath'&&take)return F.axePermission?collect(s,'sheath','A scent for Huska.'):says('askSheath','Ask Saluna before borrowing her sheath.');
   if(t==='huska'&&item===I('sheath'))return [f('axeScent'),line('axeScent','Find it, Huska.')];
   if(t==='search'&&use)return F.axeScent?[f('axeExposed'),line('axeExposed','Huska paws the mud away from the axe head.',person('narrator'))]:says('needScent','He needs something to follow.');
   if(t==='axe'&&take&&F.axeExposed&&!F.axeFound)return [add('axe'),f('axeFound'),drop('sheath'),line('goodNose','Good nose.')];
   if(t==='mature'&&item===I('axe')&&!F.reedsLoaded&&!has(s,'reeds'))return [add('reeds'),f('reedsCut')];
   if(t==='young')return says('young','Next season.');
   if(t==='clay'&&take&&!F.clayLoaded)return collect(s,'clay','Clay from the bank.');
   if(t==='sledge'&&item===I('reeds')&&!F.reedsLoaded)return [drop('reeds'),f('reedsLoaded')];
   if(t==='sledge'&&item===I('clay')&&!F.clayLoaded)return [drop('clay'),f('clayLoaded')];
   if(t==='sledge'&&use)return says('tooHeavy','Too heavy for me. Tohani has a padded harness.');
   if(t==='browse'&&take&&!F.bowlFilled)return collect(s,'browse','Cut leafy browse, away from the garden.');
   if(t==='bowl'&&item===I('browse'))return [drop('browse'),f('bowlFilled')];
   if(t==='tohani'&&talking)return need(s,['bowlFilled','reedsLoaded','clayLoaded'],'nannyNeeds','Load the sledge and fill the bowl at the hut footprint first.',()=>[f('harnessFitted'),line('harness','Tohani fits the padded harness. The lead stays in reach.',person('narrator'))]);
   if(t==='lead'&&use&&!F.sledgeMoved)return need(s,['harnessFitted','bowlFilled','reedsLoaded','clayLoaded'],'harnessFirst','Tohani should fit the harness before we lead her.',()=>[f('sledgeMoved'),add('reeds'),line('haul','The nanny pulls toward the browse. Tohani removes her harness and takes back the lead.',person('narrator'))]);
   if(t==='frame'&&item===I('reeds')&&F.sledgeMoved)return [drop('reeds'),f('reedsPlaced')];
   if(t==='washing'&&take)return collect(s,'washPot','Washing water, separate from the drinking pot.');
   if(t==='mix'&&item===I('washPot'))return F.sledgeMoved?[add('daub'),f('daubWet')]:says('clayNotHere','The clay is still on the sledge.');
   if(t==='frame'&&item===I('daub'))return F.reedsPlaced?[drop('daub'),f('wallDone'),line('daubHolds','A mesh for the clay to hold.')]:says('meshFirst','Something for it to hold.');
   if(t==='cord'&&take&&!F.cordTaken)return [add('cord'),f('cordTaken')];
  }else if(!F.riteDone){
   if(t==='oweli'&&talking)return F.riteSpoken?says('riteAlreadySpoken','Amaneti. A place we can stay.','oweli'):[talk(readyOfferings(s)?'rite':'riteRequest')];
   if(t==='riteStone'&&take&&!F.stonePlaced)return collect(s,'riteStone','Something the river has held.');
   if(t==='ahyeli'&&talking&&!F.featherPlaced)return [add('feather'),line('feather',"She left it in Kanu's hair. He won't miss it.",person('ahyeli'))];
   for(const [target,object,flag] of [['riverOffering','riteStone','stonePlaced'],['treeOffering','riteBranch','branchPlaced'],['animalOffering','feather','featherPlaced'],['homeOffering','bell','bellPlaced']]){
    if(t===target&&item===I(object)&&F.riteAsked&&!F[flag])return [drop(object),f(flag),line(`offering.${object}`,object==='bell'?'This came with us.':'A place for this, too.')];
   }
   if(t==='circle'&&use)return readyOfferings(s)?[talk(F.riteSpoken?'leadership':'rite')]:says('offeringsMissing',`Still needed: ${['stone','branch','feather','bell'].filter(x=>!F[`${x}Placed`]).join(', ')}.`);
   if(t==='saluna'&&talking&&F.riteSpoken)return [talk('leadership')];
  }else{
   if(t.endsWith('Volunteer')&&talking){
    const name=t==='lateVolunteer'?'watchLate':t==='waterVolunteer'?'watchWater':'watchBreakfast';
    return [f(name),line(`volunteer.${name}`,t==='lateVolunteer'?'I can take that last late turn.':t==='waterVolunteer'?"I'll take the morning water round.":'I can have breakfast ready for the late watch.',person(t))];
   }
   if(['tohani','saluna','ahyeli','oweli','enali','deyu'].includes(t)&&talking)return [talk(`concerns${t}`)];
   if(t==='gap'&&look)return [f('gapSeen'),line('gardenGap','The low opening is also the watering path.')];
   if(t==='gardenPlan'&&use)return need(s,['gapSeen','gardenSaluna','gardenTohani'],'gardenListen','Inspect the path and hear Saluna and Tohani first.',()=>[talk('gardenProposal')]);
   if(t==='watchPlan'&&use)return need(s,['boardSeen',...watchPeople],'watchListen','Read the clearing board. Hear all five adults and the three supporting volunteers at the bank.',()=>[talk('watchProposal')]);
   if(t==='doors'&&look)return [f('doorsSeen'),line('doors','The ground homes deserve sound bars, too.')];
   if(t==='hutPlan'&&use)return need(s,['doorsSeen','ladderSeen','hutsAhyeli','hutsOweli','hutsSaluna'],'hutsListen','Inspect doors and ladders; hear Ahyeli, Oweli and Saluna.',()=>[talk('hutProposal')]);
   if(t==='rack'&&take&&!F.hunting)return [
    ...['panel','hingeCord','latch'].filter((_,n)=>!F[['panelPlaced','hingeFitted','gardenDone'][n]]).map(add),
    ...(!F.bracesFitted?[add('braces')]:[]),...(!F.handRopeFitted?[add('handRope')]:[]),line('rackSupplies','Dedicated gate parts, door braces and a ladder hand-rope. No old supplies need salvaging.')];
   if(t==='gap'&&item===I('panel'))return F.gardenAgreed?[drop('panel'),f('panelPlaced')]:says('gateAgreement','A panel alone blocks the path. Agree on the opening first.');
   if(t==='gap'&&item===I('hingeCord'))return F.panelPlaced?[drop('hingeCord'),f('hingeFitted')]:says('panelFirst','The cord needs a panel.');
   if(t==='gap'&&item===I('latch'))return need(s,['panelPlaced','hingeFitted','gardenAgreed'],'latchFirst','Fit the panel and hinge cord first.',()=>[drop('latch'),f('gardenDone'),line('gateTest','The gate swings clear. Tohani brings browse while Saluna marks the seedlings.',person('narrator'))]);
   if(t==='doors'&&item===I('braces'))return F.hutsAgreed?[drop('braces'),f('bracesFitted'),line('barsTest','Oweli and Saluna test their own bars from inside.',person('narrator'))]:says('doorsAgree','Hear the households before changing their doors.');
   if(t==='rack'&&use){
    if(F.hunting)return [go('clearing')];
    return need(s,['gardenDone','watchDone','hutsDone'],'huntWait',!F.gardenDone?'The watering gate still needs agreement and a working latch.':!F.watchDone?'The watch needs its volunteers and a recorded roster.':'The doors and ladder practice are not finished.',()=>[f('hunting'),add('bow'),add('arrows'),add('bluntArrow'),add('knife'),add('carrier'),...card('huntCard','That afternoon · The woodland clearing'),go('clearing')]);
   }
  }
  if(t==='toClearing'&&v==='go'&&F.waterDone)return [go('clearing')];
 }
 if(s.room==='clearing'){
  if(t==='toRiver'&&v==='go')return [go('river')];
  if(t==='toForest'&&v==='go')return F.hunting?[go('forest')]:says('roofsFirst',F.riteDone?'The three agreements need finishing before I go hunting.':'Roofs first. Hunting can wait.');
  if(!F.built){
   if(t==='fork'&&item===I('lineArrow')&&!F.lineHung){
    if(!has(s,'bow')||!F.bowUnfolded)return says('openBowFirst','Unfold the bow and check its catch first.');
    return [...drawBow(s,ROOMS.clearing.hotspots.find(h=>h.id===t)!.walkTo!.x),drop('lineArrow'),f('lineHung'),line('shootLine','The arrow carries the light cord over the fork and drops in the clear patch. Kofi draws the line through and recovers the arrow.',person('narrator'))];
   }
   if(t==='bark'&&item===I('axe')&&!F.ropeMade)return [add('bark'),f('barkCut'),line('fallenBark','Long strips from a fallen trunk. Leave the living tree alone.')];
   if(t==='board'&&use&&has(s,'bark')&&!F.ropeMade)return [drop('bark'),add('rope'),f('ropeMade'),line('twistRope','Twist the bark into a load rope.')];
   if(t==='rig'&&item===I('rope'))return F.lineHung?[drop('rope'),f('ropeHung'),line('heavyLine','The light line draws the stronger rope over the fork.')]:says('lightFirst','Get a light line over the fork first.');
   if(t==='cradle'&&use)return F.ropeHung?[f('cradleTied'),line('cradleTied','The cradle is tied. Ask Saluna and Tohani at the bank to help haul.')]:says('weakLine','The light cord would snap under a beam.');
  }
  if(t==='platform'&&take&&F.built&&!F.riteDone&&!F.branchTaken)return [add('riteBranch'),f('branchTaken'),line('deadBranch','A loose dead branch, reached from the completed platform.')];
  if(F.riteDone){
   if(t==='board'&&look)return [f('boardSeen'),line('watchBoard',F.watchDone?'Night one: Ahyeli early / Kofi late. Night two: Tohani early / Saluna late. Night three: our surviving neighbour early / the volunteer late. Oweli covers childcare; water and breakfast are covered. Review after three nights.':'The same two marks, over and over.')];
   if(t==='board'&&use)return F.watchAgreed?[f('watchDone'),line('writeRoster','Kofi records the agreed three-night roster and supporting work. Review after three nights.',person('narrator'))]:says('rosterFirst','Hear the offers and agree on supporting work at the bank first.');
   if(t==='ladder'&&look)return [f('ladderSeen'),line('ladder','Someone must be able to help the children descend.')];
   if(t==='ladder'&&item===I('handRope'))return need(s,['hutsAgreed','practiceAsked'],'ropeRequest','Ask Ahyeli about practice first.',()=>[drop('handRope'),f('handRopeFitted')]);
   if(t==='practice'&&use)return need(s,['practiceAsked','handRopeFitted','bracesFitted'],'practiceWait','Agree on homes, brace the ground doors and fit the requested hand-rope first.',()=>[f('hutsDone'),line('practiceDone',"Yes. With the rope, we can do it.",person('ahyeli')),line('oweliLatch','I can reach my own latch. A fine luxury.',person('oweli'))]);
  }
 }
 if(s.room==='forest'){
  if(t==='return'&&v==='go')return [go('clearing')];
  if(t==='tracks'&&look)return says('bearTracks','Wide. Fresh. Not what we came for.');
  if(t==='brush')return says('brush','Something big went through here. I cannot see what I would hit.');
  if(t==='log'&&look)return [f('logSeen'),f('vineSeen'),line('log','No room to step back with that behind me. A rotten vine holds the side limb.')];
  if(t==='limb'&&look)return [f('vineSeen'),line('limbLook','Still held at the far end.')];
  if(t==='vine'&&item===I('knife')&&F.vineSeen)return [f('vineCut'),line('vineCut','The binding gives.')];
  if(t==='limb'&&use)return F.vineCut?[f('laneClear'),line('laneClear','The return lane is clear.')]:says('limbHeld','Still held at the far end.');
  if(t==='huska'&&talking)return F.laneClear?[...readyBow(s),line('bearStart','Back, Huska.'),{type:'fight',id:'kofiBear'},f('bearWon'),talk('bearAftermath')]:says('huskaWait','Huska has stopped for a reason. Check the way back.');
 }
 if(s.room==='hut'){
  // A raised pole is a sequential state, never a real-time hold. Other actions lower it safely.
  if(t==='beam'&&look)return [f('beamSeen'),line('beam','One end rests on the stone sill, pinning the net.')];
  if(t==='pole'&&take&&!F.robotFreed)return collect(s,'pole','Long enough to lift that end.');
  if(t==='wedge'&&take&&!F.beamSupported)return collect(s,'wedge','A wedge for the lifted beam.');
  if((t==='beam'||t==='sill')&&item===I('pole')&&!F.beamSupported)return [f('beamRaised'),line('lever','The sill takes the lever. Set the wedge next.')];
  if((t==='beam'||t==='sill')&&item===I('wedge')&&F.beamRaised)return [drop('wedge'),f('beamSupported'),f('beamRaised',false),line('wedgeSet','The beam rests securely on the wedge.')];
  if(t==='drawcord'&&use)return F.beamSupported?[f('netLoose'),line('cordLoose','Unpick the drawcord, without tightening the loops.')]:says('weightFirst',"I'll bring it down on you. Lift the weight first.");
  if(t==='nets'&&use)return need(s,['beamSupported','netLoose'],'loopsFirst','The loops tighten. Loosen the drawcord first.',()=>[f('robotFreed'),drop('pole'),line('robotEmerges','A scuffed brass body and six jointed legs emerge into the moonlight. An arrow rolls under the cold hearth stone.',person('narrator')),line('oh','Oh.'),line('rat','That was a lot of trouble for a rat.')]);
  if(t==='stool'&&take)return [f('robotHidden'),line('notPot',"You're not a pot.")];
  if(t==='stool'&&(use||talking))return [f('robotHidden'),line('robotRetreat','It retreats under the stool.',person('narrator'))];
  if(t==='gap'&&use&&F.robotFreed&&!F.arrowRetrieved){
   if(F.retrievalAsked)return says('refusalStands','It stays still. Asking again changes nothing.');
   return [f('retrievalAsked'),line('askRetrieval','That one. If you can.'),line('refusal','The machine stays still.',person('narrator')),line('suitYourself','Suit yourself.')];
  }
  if(t==='bedroll'&&(use||v==='lie')&&F.robotFreed&&!F.arrowRetrieved)return [f('arrowRetrieved'),f('robotHidden',false),line('giveSpace','Kofi sits back and looks away. The machine retrieves the arrow and leaves it on the clear floor.',person('narrator'))];
  if(t==='arrow'&&take&&F.arrowRetrieved&&!F.arrowTaken)return [f('arrowTaken'),add('arrow')];
  if(t==='shelf'&&item===I('arrow')&&F.arrowRetrieved&&!F.arrowShelved)return [drop('arrow'),f('arrowShelved'),f('complete'),line('useful','Useful, then.'),line('settled','Kofi leaves a dry bedroll corner. The machine settles beside it and briefly touches the repaired bell strap. The wedge stays under the beam; the loose pole rests by the hearth.',person('narrator')),{type:'checkpoint'},{type:'chooseChapter'}];
  if(t==='gap')return says('gapLook',F.arrowRetrieved?'Everything back where I can reach it.':"I can see it. Can't reach it. The pole is too broad.");
  if(t==='nets'&&F.robotFreed)return says('netsLater','They can wait until morning.');
 }
 if(look){const spot=ROOMS[s.room].hotspots.find(h=>h.id===t&&conditionsHold(s,h.visibleIf));return says(`look.${s.room}.${t}`,spot?strings[spot.name]:'There is room to look before acting.');}
 if(talking)return says(`talk.${s.room}.${t}`,F.riteDone?'We can change it if it does not hold.':'One thing at a time.',t==='huska'?undefined:t);
 return says('wrongUse','That will not help here. Keep it for the right task.');
}

/** Resume only pending milestones. All irreversible choices are stored before a transition. */
export function advance(s:GameState):Command[]{
 const F=s.flags;
 if(F.complete)return [{type:'chooseChapter'}];
 if(F.home&&s.room!=='hut')return [...inventoryCleanup(s,['bell']),go('hut')];
 if(F.campDone&&s.room==='camp')return campDawn(s);
 if(s.room==='tsalohi'&&!F.warning&&all(s,'gateDone','potDone','chickenDone'))return [f('warning'),{type:'shake',ms:350},line('warning','Huska growls at the rattling cup. The first crack opens through the square.',person('narrator')),line('away','Away from the edge. Everyone.',person('oweli'))];
 if(s.room==='tsalohi'&&(F.enaliSaved||F.deyuSaved))return [f('escaped'),...inventoryCleanup(s,['bell','bow','arrows','bluntArrow']),line('rescueLoss',F.enaliSaved?"Deyu's ledge drops out of sight. Enali catches Kofi's shoulder.":"Enali's ledge drops out of sight. Deyu braces Kofi on the footing.",person('narrator')),...card('campCard','Three nights later · The trail camp'),go('camp')];
 if(s.room==='camp'&&!F.bowExplained&&!F.wolvesWon)return [talk('bowIntroduction')];
 if(s.room==='camp'&&!F.wolvesWon&&all(s,'herdGathered','brandLit'))return [...readyBow(s),{type:'checkpoint'},{type:'fight',id:'kofiWolves'},f('wolvesWon'),{type:'checkpoint'},talk('wolfAftermath')];
 if(s.room==='clearing'&&F.helpersAgreed&&!F.beamLifted)return [f('beamLifted'),line('sharedLift','Saluna and Tohani haul while Kofi guides the beam. The adults secure it.',person('narrator')),...(F.wallDone?finishBuilding(s):[])];
 if(!F.built&&all(s,'wallDone','beamLifted'))return finishBuilding(s);
 if(F.leadershipAccepted&&!F.riteDone)return [f('riteDone'),add('bell'),line('bellReturned','Tohani returns the bell with its repaired strap.',person('narrator')),...card('monthsCard','Three months after Tsalohi · Morning · Amaneti'),go('river')];
 if(s.room==='forest'&&F.bearWon&&!F.home&&(F.bearKilled||F.bearReleased))return [f('home'),...inventoryCleanup(s,['bell']),line('bearHome',F.bearKilled?'The last shot stays behind the log. Kofi recovers his arrows. At home, Saluna asks if he is hurt and gives him a bowl of roots.':'Huska returns to heel. They leave the bear room and recover the arrows safely. Saluna gives Kofi a bowl of roots.',person('narrator')),...card('hutCard','That evening · Kofi’s hut · Amaneti'),go('hut')];
 if(s.room==='camp'&&F.wolvesWon&&!F.wolfKilled&&!F.wolfReleased)return [talk('wolfAftermath')];
 if(s.room==='forest'&&F.bearWon&&!F.bearKilled&&!F.bearReleased)return [talk('bearAftermath')];
 return [];
}
function finishBuilding(s:GameState):Command[]{return [f('built'),...inventoryCleanup(s,['bell']),...card('constructionCard','Days later · The river'),line('montage','Neighbours finish the other walls, add a ladder and complete the first tree platform. Kofi sets down two cups, then moves the absent neighbour’s cup aside.',person('narrator')),line('joinCheck',s.flags.deyuSaved?'Deyu checks the finished joins.':'Saluna and Kofi check the surviving lash pattern together.',person('narrator')),...card('weeksCard','Three weeks after Tsalohi · Dusk · The river settlement'),go('river')];}
function campDawn(s:GameState):Command[]{return [f('campDone'),...inventoryCleanup(s,['bell','bow','arrows','bluntArrow']),...card('riverCard','Six days after Tsalohi · Morning · The river'),go('river')];}

export function afterDialogue(_id:string,s:GameState):Command[]{
 const commands=_id==='wolfAftermath'&&(s.flags.wolfKilled||s.flags.wolfReleased)?[line('wolfEnd',s.flags.wolfKilled?'Kofi finishes the wolf out of view, then recovers his arrows.':'Kofi holds Huska until the wolf gets clear, then recovers his arrows.',person('narrator')),line('herdInside','Keep the herd inside the light. The trail will be ready at dawn.')]:advance(s);addStrings(strings);return commands;
}
export function interact(s:GameState,v:Verb,t:string,item?:string):Command[]{
 const spot=ROOMS[s.room]?.hotspots.find(h=>h.id===t&&conditionsHold(s,h.visibleIf));
 if(!spot&&!t.startsWith('item:'))return [];
 if(!item&&spot&&!spot.verbs.includes(v))return [];
 const commands=action(s,v,t,item);
 // Lower the lever on any action other than setting the wedge, without losing either tool.
 if(s.flags.beamRaised&&!s.flags.beamSupported&&!commands.some(c=>c.type==='setFlag'&&(c.flag==='beamSupported'||c.flag==='beamRaised')))commands.unshift(f('beamRaised',false));
 const simulated=structuredClone(s);
 for(const c of commands){if(['dialogue','room','fight','chooseChapter'].includes(c.type))break;applyCommand(simulated,c);}
 if(!commands.some(c=>['dialogue','room','fight','chooseChapter'].includes(c.type)))commands.push(...advance(simulated));
 addStrings(strings);
 return [...(spot?.walkTo?[{type:'walk' as const,to:spot.walkTo,face:spot.face}]:[]),...commands];
}
