import type { Chapter } from '../types';
import type { GameState } from '../../engine/types';
import { addStrings } from '../../engine/i18n';
import { ROOMS } from './rooms';
import { advance, afterDialogue, interact } from './interactions';
import { DIALOGUES, FLAGS, FLAG_ROOMS, ITEMS, f, line, person, strings, text, card } from './data';

const goals=[
 ['gate','Repair Tohani’s gate and take the loose bell','gateDone','Ask the person repairing things.','Ask Deyu for the pin, use it on the gate and take the loose bell.'],
 ['pot','Carry Enali’s pot to the trestle','potDone','Enali set something beside the pot.','Ask for the cloth, take it, use it on the pot and put the pot on the trestle.'],
 ['hens','Get the hens home and return the scoop','chickenDone','Watch what they follow.','Ask Ahyeli, borrow grain, use it on the coop, close the coop and return the scoop to its hook.'],
 ['rescue','Release the hens, then choose one rescue','escaped','Neither ledge permits a second crossing.','Open the transport catch, then use the inland gate. Choose Enali or Deyu explicitly; there is no route that saves both.'],
 ['camp','Hold the firelight','campDone','The blunt arrow can reach the dry stick. The herd needs light.','Use the blunt arrow on the dead bough with the bow unfolded, then take the fallen stick. Speak to Tohani, ask Huska to gather the goats and light the stick at the fire. Stop the pack, then choose the aftermath.'],
 ['water','Establish the drinking-water point','waterDone','Compare the muddy intake and upper run.','Enali: inspect the trough, take its strips, combine strips and trough, install and level it with a shore stone, add the screen. Deyu: follow tracks, clear leaves with a twig, inspect both flows and ask Saluna. Fill the pot at the checked seep and heat it at the fire.'],
 ['axe','Find the communal axe','axeFound','Huska knows the reed bed.','Ask Saluna, take the sheath, let Huska smell it, search the reeds and take the exposed axe.'],
 ['wall','Haul and daub the first ground wall','wallDone','The nanny needs a reason to walk there.','Cut mature reeds, load reeds and clay on the sledge, put browse in the bowl, ask Tohani to harness the nanny and use the lead. Place reeds on the frame, mix washing water with the clay and apply daub.'],
 ['platform','Raise and secure the first platform beam','built','The line-carrying arrow Kofi described at camp can reach the fork.','Combine bank cord with an arrow, unfold the bow if needed and use the line-arrow on the clearing fork. Cut fallen bark and twist rope at the work board. Draw it over with the light line, tie the cradle and ask Saluna at the bank to help after the sledge is unloaded.'],
 ['rite','Give the place a name and accept shared leadership','riteDone','Oweli asked for river, tree, animals and old home.','Ask Oweli, gather a shore stone, clearing platform branch, Ahyeli’s feather and your bell. Place them in the four named spaces. Speak when ready, then speak with Saluna about leadership.'],
 ['garden','Agree on a working watering gate','gardenDone','Hear why the path and browse matter.','Inspect the gap, hear Tohani and Saluna, propose the fence and revise it into a latched gate plus browse. Take rack supplies and fit panel, hinge cord and latch.'],
 ['watch','Share watches and supporting work','watchDone','A watch needs cover at home, too.','Read the clearing board; hear the five adults and all three volunteers at the bank. Revise equal shifts into shared watches and supporting work, then record it at the clearing board.'],
 ['huts','Agree on homes, brace doors and practise the ladder','hutsDone','Height is not everyone’s idea of safety.','Inspect bank doors and clearing ladder. Hear Ahyeli, Oweli and Saluna, revise a proposal into household choice with ground-door improvements. Fit braces, ask Ahyeli to practise, fit the hand-rope and use the clearing practice target.'],
 ['forest','Clear the return lane and get home','home','Huska has stopped for a reason.','Choose Go hunting at the bank rack, pass through the clearing and inspect the forest log. Cut the exposed vine with your knife, pull the limb clear and call Huska back. Stop the bear, then choose the aftermath.'],
 ['nets','Free the creature from the nets','robotFreed','Lift the weight before loosening the net.','Take the pole and wedge. Lever the beam against the sill, set the wedge next, loosen the drawcord and draw the net clear.'],
 ['home','Leave room for the little machine','complete','It came out when you moved away.','You may invite it once at the gap, then sit back at the bedroll. Take the retrieved arrow and return it to the shelf.'],
];
for(const [id,title,,hint1,hint2] of goals){strings[`obj.kofi.${id}`]=title;strings[`hint.kofi.${id}.1`]=hint1;strings[`hint.kofi.${id}.2`]=hint2;}
const stageGoals=(s:GameState)=>{
 const F=s.flags;
 const ids=!F.warning?['gate','pot','hens']:!F.escaped?['rescue']:!F.campDone?['camp']:!F.waterDone?['water']:!F.built?['axe','wall','platform']:!F.riteDone?['rite']:!F.home?['garden','watch','huts','forest']:!F.robotFreed?['nets']:['home'];
 return goals.filter(g=>ids.includes(g[0])).map(([id,,flag])=>({key:`obj.kofi.${id}`,done:!!F[flag],optional:false}));
};
const diaryEntries:[string,string,string[]][]=[
 ['supper','Supper nearly ready. Deyu says the next boat will float. Enali wants to see the birds.',['gateDone','potDone','chickenDone']],
 ['enali','I got Enali out. Deyu was on the other side. I keep seeing the space between us.',['escaped','enaliSaved']],
 ['deyu','I got Deyu out. Enali was on the other side. I keep seeing the space between us.',['escaped','deyuSaved']],
 ['bow','Ahyeli asked about the folding bow Deyu made for me. Hunting points for supper, a round wooden head for small jobs, a light line for things my hands cannot reach. Fetch the arrows back.',['bowExplained']],
 ['wolfKilled','We held the clearing. I killed the wolf left behind. Nobody slept much.',['campDone','wolfKilled']],
 ['wolfReleased','We held the clearing. I kept Huska back and let the last wolf leave. Nobody slept much.',['campDone','wolfReleased']],
 ['waterEnali','Enali found the better water. I fitted the feet Deyu was not here to make.',['waterDone','enaliSaved']],
 ['waterDeyu','Deyu made the water stand. Saluna checked the source with me. I wanted Enali there to ask.',['waterDone','deyuSaved']],
 ['roof','The first roof holds. Huska found the axe; the nanny did the hauling. Everyone keeps thanking me.',['built']],
 ['amaneti','We called it Amaneti. They asked me to lead. I asked them not to leave me doing it alone.',['riteDone']],
 ['promiseRoom','I said we would leave room for those still coming.',['riteDone','promiseRoom']],
 ['promiseCare','I said we would look after what lets us live here.',['riteDone','promiseCare']],
 ['remCraft','Deyu made things that held.',['riteDone','rememberedCraft']],['remBoat','Deyu was making Kanu a boat.',['riteDone','rememberedBoat']],
 ['remRoom','Enali always left room beside her.',['riteDone','rememberedRoom']],['remBirds','Enali wanted to see the birds.',['riteDone','rememberedBirds']],
 ['agreements','A gate needs a way through. A watch needs someone awake enough to do it. Today we changed three of my answers.',['gardenDone','watchDone','hutsDone']],
 ['bearKilled','A bear came at us beyond the fallen log. I killed it. Huska is sleeping by the door.',['home','bearKilled']],
 ['bearReleased','A bear came at us beyond the fallen log. We got clear and let it go. Huska is sleeping by the door.',['home','bearReleased']],
 ['robot','Found a little machine caught in the nets. Six legs. Got it loose. It fetched an arrow I could not reach. I have left it a dry corner.',['complete']],
];

export const KOFI1:Chapter={
 id:'kofi1',title:'chapter.kofi1',mapName:'chapter.kofi1.short',start:{room:'tsalohi',entry:'start'},npcs:{},
 startItems:[],rooms:ROOMS,flags:FLAGS,items:ITEMS,keptItems:[],secretFlags:[],metFlags:[],flagRooms:FLAG_ROOMS,
 interact,actorVerbs:{hero:['look']},itemVerbs:['look','use'],interactionKeys:Object.keys(strings).filter(k=>k.startsWith('kofi.')),
 dialogues:DIALOGUES,crowds:{},extras:[],spares:[],rewards:{},battleMode:'archery',
 encounters:{
  kofiWolves:{id:'kofi-wolves',title:'Hold the firelight',enemy:{name:'Wolf pack',label:'Pack',maxHp:20,intents:[{name:'Circling bite',damage:3,block:0},{name:'Pack rush',damage:6,block:0}]},energyPerTurn:3,handSize:6,introduction:'The wolves approach the gathered herd.',victoryText:'The pack scatters. One injured wolf remains.'},
  kofiBear:{id:'kofi-bear',title:'Leave room to withdraw',enemy:{name:'Bear',label:'Bear',maxHp:28,intents:[{name:'Heavy swipe',damage:4,block:0},{name:'Charge',damage:9,block:0}]},energyPerTurn:3,handSize:6,introduction:'The bear charges before they can withdraw together.',victoryText:'The bear is no longer advancing.'},
 },
 intro:['kofi.intro','kofi.open'],when:{day:-1460,time:'kofi.time',place:'kofi.place',viewpoint:'kofi.name'},dateLabel:'kofi.when',
 hero:{name:'kofi.name',portrait:'kofi-test-hero',sheet:'kofi-test-hero',mara:false,abilities:[]},pin:'kofiWoods',
 diary:diaryEntries.map(([id,words,after])=>({key:text(`diary.${id}`,words),after})),
 map:{at:s=>s.room==='tsalohi'?'tsalohi':s.room==='camp'?'kofiTrail':s.room==='clearing'?'kofiClearing':s.flags.riteSpoken?'amaneti':'kofiRiver',known:F=>['tsalohi','rift',...(F.escaped?['kofiTrail']:[]),...(F.campDone?['kofiRiver']:[]),...(F.clearingSeen?['kofiClearing']:[]),...(F.riteSpoken?['amaneti']:[])]},
 objectives:stageGoals,objectiveKeys:goals.map(([id])=>`obj.kofi.${id}`),lineMoods:{},strings,
 story:{music:[],ambience:[],defaultAmbience:'wind',hush:[],crowdMood:[],crowdReactsTo:[],flagSounds:{},guided:[],
  heroSheet:[{if:[{flag:'hunting'},{notFlag:'home'}],pick:'kofi-test-travel'},{if:[{flag:'escaped'},{notFlag:'built'}],pick:'kofi-test-travel'},{pick:'kofi-test-hero'}],
  onEnter:Object.keys(ROOMS).map(room=>({room,run:s=>{
   const pending=advance(s);if(pending.length){addStrings(strings);return pending;}
   const commands=room==='tsalohi'&&!s.looks['kofi:opening']?[{type:'looked' as const,id:'kofi:opening'},line('openingOweli',"Before you sit down, Kofi. Tohani's gate.",person('oweli')),line('gateYesterday','It was his gate yesterday.'),line('stayedShut','Yesterday it stayed shut.',person('oweli'))]
    :room==='clearing'&&!s.flags.clearingSeen?[f('clearingSeen'),line('clearing','Dry ground. Room above it.')]
    :room==='forest'&&!s.flags.forestSeen?[f('forestSeen'),...card('forestCard','That afternoon · The deep forest')]:[];
   addStrings(strings);return commands;
  }})),afterDialogue,
 },
 art:()=>import('./art').then(m=>m.registerChapterArt()),
};
