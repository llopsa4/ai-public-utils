import type { Command, Condition, GameState, Speaker } from '../../engine/types';
import type { DialogueTree, DialogueNode } from '../../engine/dialogue';
import { addStrings } from '../../engine/i18n';

// Runtime content contains this prologue only. Never import the ensemble STORY.md or art spec.
export const strings: Record<string,string> = {
  'chapter.kofi1': 'A Place to Stay', 'chapter.kofi1.short': 'Prologue',
  'kofi.name': 'Kofi', 'kofi.when': 'Four years ago', 'kofi.time': 'Evening',
  'kofi.place': 'Tsalohi → Amaneti', 'kofi.intro': 'Four years before Day 1 · Evening · Tsalohi',
  'kofi.open': 'Supper is nearly ready. Oweli has one more thing to ask.',
  'place.tsalohi': 'Tsalohi', 'place.kofiTrail': 'The travelled trail',
  'place.kofiRiver': 'The river', 'place.kofiClearing': 'The woodland clearing',
  'place.amaneti': 'Amaneti', 'place.rift': 'The Rift',
};
export const text = (id:string, value:string) => { strings[`kofi.${id}`]=value;addStrings({[`kofi.${id}`]:value});return `kofi.${id}`; };
export const line = (id:string,value:string,who:Speaker='hero'):Command => ({type:'say',actor:who,text:text(id,value)});
export const person = (id:string):Speaker => `extra-kofi-${id}`;
for(const who of ['oweli','saluna','tohani','ahyeli','enali','deyu','huska','narrator','survivor','lateVolunteer','waterVolunteer','breakfastVolunteer'])
 strings[`speaker.${person(who)}`]=who==='narrator'?'':who==='survivor'?'Your neighbour':who.replace(/Volunteer/,' volunteer').replace(/^./,s=>s.toUpperCase());
export const f=(flag:string,value=true):Command=>({type:'setFlag',flag,value});
export const I=(id:string)=>`kofi${id[0].toUpperCase()}${id.slice(1)}`;
export const add=(id:string):Command=>({type:'addItem',item:I(id)});
export const drop=(id:string):Command=>({type:'removeItem',item:I(id)});
export const has=(s:GameState,id:string)=>s.inventory.includes(I(id));
export const all=(s:GameState,...flags:string[])=>flags.every(k=>s.flags[k]);
export const go=(room:string):Command=>({type:'room',room,entry:'start'});
export const talk=(id:string):Command=>({type:'dialogue',id});
export const card=(id:string,value:string):Command[]=>[
  {type:'fade',to:'black',ms:350},line(id,value,person('narrator')),{type:'fade',to:'clear',ms:350},
];
export const ITEMS = ['bell','pin','cloth','hotPot','grain','bow','arrows','bluntArrow','branch','brand','pot','trough','strips','stone','screen','twig','sheath','axe','reeds','clay','browse','washPot','daub','cord','lineArrow','bark','rope','riteStone','riteBranch','feather','panel','hingeCord','latch','braces','handRope','knife','carrier','pole','wedge','arrow'].map(I);
for(const id of ITEMS) strings[`name.${id}`]=id.slice(4).replace(/([A-Z])/g,' $1').trim();
export const FLAG_ROOMS:Record<string,string>={};
const flags=(room:string,names:string)=>names.split(' ').forEach(n=>FLAG_ROOMS[n]=room);
flags('tsalohi','pinGiven pinFitted bellTaken gateDone clothAllowed potLifted potDone grainAllowed hensInside coopClosed chickenDone warning hensFreed enaliSaved deyuSaved escaped');
flags('camp','bowExplained bowUnfolded branchLoose herdPlan herdGathered brandLit wolvesWon wolfKilled wolfReleased campDone');
flags('river','mudSeen seepSeen sourceChecked troughSeen tracksFollowed leavesCleared waterTalk stripsFitted troughPlaced troughLevel screenFitted potFilled waterDone axePermission axeScent axeExposed axeFound reedsCut reedsLoaded clayLoaded bowlFilled harnessFitted sledgeMoved reedsPlaced daubWet wallDone cordTaken helpersAgreed built riteAsked stonePlaced branchPlaced featherPlaced bellPlaced riteSpoken rememberedCraft rememberedBoat rememberedRoom rememberedBirds thankedDogs thankedAnimals promiseRoom promiseCare leadershipAccepted riteDone gapSeen gardenSaluna gardenTohani gardenObjection gardenAgreed panelPlaced hingeFitted gardenDone watchTohani watchSaluna watchAhyeli watchOweli watchSurvivor watchLate watchWater watchBreakfast watchObjection watchAgreed doorsSeen hutsAhyeli hutsOweli hutsSaluna hutsObjection hutsAgreed bracesFitted hunting');
flags('clearing','clearingSeen lineHung barkCut ropeMade ropeHung cradleTied beamLifted branchTaken boardSeen watchDone ladderSeen practiceAsked handRopeFitted hutsDone');
flags('forest','forestSeen logSeen vineSeen vineCut laneClear bearWon bearKilled bearReleased home');
flags('hut','beamSeen beamRaised beamSupported netLoose robotFreed robotHidden retrievalAsked arrowRetrieved arrowTaken arrowShelved complete');
export const FLAGS=Object.keys(FLAG_ROOMS);

export type Period='opening'|'disaster'|'camp'|'water'|'building'|'rite'|'settlement'|'hunt'|'home';
export const PERIODS:Record<Period,Condition[]>={
 opening:[{notFlag:'warning'}], disaster:[{flag:'warning'},{notFlag:'escaped'}],
 camp:[{flag:'escaped'},{notFlag:'campDone'}],water:[{flag:'campDone'},{notFlag:'waterDone'}],
 building:[{flag:'waterDone'},{notFlag:'built'}],rite:[{flag:'built'},{notFlag:'riteDone'}],
 settlement:[{flag:'riteDone'},{notFlag:'hunting'}],hunt:[{flag:'hunting'},{notFlag:'home'}],home:[{flag:'home'}],
};
export const DIALOGUES:Record<string,DialogueTree>={};
export const choice=(label:string,next:string|null,if_?:Condition[])=>({text:text(`choice.${label}`,label),next,if:if_});
export const node=(id:string,words:string,who:string='kofi',set?:Record<string,boolean>):DialogueNode=>({
 lines:[{actor:who==='kofi'?'hero':person(who),text:text(`dialogue.${id}`,words)}],set,
});
export function menu(id:string,words:string,choices:ReturnType<typeof choice>[],nodes:Record<string,DialogueNode>,who='kofi') {
 DIALOGUES[id]={start:'start',nodes:{start:{...node(`${id}.start`,words,who),choices},...nodes}};
}
menu('rescue','The ledges are breaking. Kofi can reach only one person.',[
 choice('Go to Enali','enali'),choice('Go to Deyu','deyu'),choice('Keep looking',null),
],{
 enali:node('rescue.enali','Hold my shoulder.','kofi',{enaliSaved:true}),
 deyu:node('rescue.deyu','Both hands. Now.','kofi',{deyuSaved:true}),
},'narrator');
for(const animal of ['wolf','bear'])menu(`${animal}Aftermath`,'It is no longer advancing. There is room to leave.',[
 choice('End its life','kill'),choice(animal==='wolf'?'Keep Huska back and let it leave':'Call Huska back and leave it a way out','release'),
],{
 kill:node(`${animal}.kill`,'Back, Huska.', 'kofi',{[`${animal}Killed`]:true}),
 release:node(`${animal}.release`,'Stay with me, Huska.', 'kofi',{[`${animal}Released`]:true}),
});
menu('campPlan','Can we bring the herd closer?',[
 choice('Bring the herd into the light','agree'),choice('We should keep walking','walking'),choice('Not yet',null),
],{
 agree:node('camp.agree','If Huska keeps them together.','tohani',{herdPlan:true}),
 walking:{...node('camp.walking','Kanu is asleep on his feet.','ahyeli'),next:'start'},
},'kofi');
DIALOGUES.bowIntroduction={start:'ask',nodes:{
 ask:{...node('bow.ask','You kept Deyu’s little folding bow.','ahyeli'),next:'maker'},
 maker:{...node('bow.maker','He made it after I caught my old one in every branch between home and the river.'),next:'request'},
 request:{...node('bow.request','I asked for a shorter bow. He said I needed a smaller forest.'),next:'fold'},
 fold:{...node('bow.fold','So he made the limbs fold alongside the grip. Wood, leather hinges, a proper catch. It fits along my leg.'),next:'hands'},
 hands:{...node('bow.hands','And leaves your hands free for whatever everyone asks you to carry.','ahyeli'),next:'open'},
 open:{...node('bow.open','Kofi unfolds the limbs and checks the catch before stringing the bow.','narrator'),set:{bowUnfolded:true},next:'point'},
 point:{...node('bow.point','The pointed arrows are for hunting. The round wooden head is for small jobs. Knocking a dry stick loose, or shaking seedpods onto a cloth.'),next:'line'},
 line:{...node('bow.line','Tie light cord to an ordinary arrow and it carries the line over a branch. Then I can draw a stronger rope through for a net or a roof beam.'),next:'limit'},
 limit:{...node('bow.limit','The little cord never lifts the load itself. And I fetch the arrows back. Deyu always asked about those first.'),next:'snag'},
 snag:{...node('bow.snag','There is a dry stick caught up there. We could use it for the fire.','ahyeli'),set:{bowExplained:true}},
}};
menu('riteRequest','Will you carry the words?',[
 choice("I couldn't bring everyone here",'grief'),choice("I don't know the song",'song'),choice('Tell me what you need','request'),choice('Not yet',null),
],{
 grief:{...node('rite.grief','No. Sit with me a moment. Bring their names too.','oweli'),next:'request'},
 song:{...node('rite.song','The words can be yours.','oweli'),next:'request'},
 request:node('rite.request','River, tree, animals, old home. Bring those, then I will ask again.','oweli',{riteAsked:true}),
},'oweli');
DIALOGUES.rite={start:'remember',nodes:{
 remember:{...node('rite.remember','Will you speak?', 'oweli'),choices:[choice('Speak','names'),choice('Not yet',null)]},
 names:{branch:[{if:[{flag:'enaliSaved'}],next:'deyu'},{next:'enali'}]},
 deyu:{choices:[choice('Deyu made things that held','craft'),choice("Deyu was making Kanu a boat",'boat')]},
 enali:{choices:[choice('Enali always left room beside her','room'),choice('Enali wanted to see the birds','birds')]},
 craft:{set:{rememberedCraft:true},next:'others'},boat:{set:{rememberedBoat:true},next:'others'},
 room:{set:{rememberedRoom:true},next:'others'},birds:{set:{rememberedBirds:true},next:'others'},
 others:{...node('rite.others','And the others whose names we carry.'),choices:[choice("The dogs heard what we couldn't",'dogs'),choice('We followed the animals. They brought us here.','animals')]},
 dogs:{set:{thankedDogs:true},next:'promise'},animals:{set:{thankedAnimals:true},next:'promise'},
 promise:{choices:[choice("We'll leave room for those still coming",'roomPromise'),choice("We'll look after what lets us live here",'carePromise')]},
 roomPromise:{set:{promiseRoom:true},next:'name'},carePromise:{set:{promiseCare:true},next:'name'},
 name:{...node('rite.name','River. Trees. Ground beneath us. Let this be a place we can stay.'),next:'amaneti'},
 amaneti:node('rite.amaneti','Amaneti.','oweli',{riteSpoken:true}),
}};
menu('leadership',"We're asking you to work with us. You can ask us too.",[
 choice("Then don't leave me to guess",'accept'),choice("I'll need help",'accept'),choice('I need time',null),
],{accept:node('leadership.accept',"We know who isn't here.",'survivor',{leadershipAccepted:true})},'saluna');

menu('gardenProposal','How should we keep the goats out?',[
 choice('Keep them tied','tied'),choice('Saluna can watch them','watch'),choice('Fence the gap','fence'),
 choice('A latched gate, and browse brought inside','gate',[{flag:'gardenObjection'}]),choice('Not yet',null),
],{
 tied:node('garden.tied',"All day? They need to move.",'tohani'),
 watch:node('garden.watch','Then who tends the rest?','saluna'),
 fence:node('garden.fence','A fixed fence blocks the watering path.','tohani',{gardenObjection:true}),
 gate:node('garden.gate',"I'll bring browse on my herd round. Saluna can mark the swing clear of the plants.",'tohani',{gardenAgreed:true}),
});
menu('watchProposal','What can each person take on?',[
 choice("I'll take every night",'alone'),choice('Equal names, equal shifts','equal'),
 choice('Share watches and supporting work','shared',[{flag:'watchObjection'}]),choice('Not yet',null),
],{
 alone:node('watch.alone','And sleep when?','saluna'),
 equal:node('watch.equal',"I need someone with the children. Oweli can sit indoors, not stand a cold watch.",'ahyeli',{watchObjection:true}),
 shared:node('watch.shared',"Three nights, early and late turns. Childcare, water and breakfast count too. If it doesn't hold, we change it.",'kofi',{watchAgreed:true}),
});
menu('hutProposal','How should we use the huts?',[
 choice('Draw lots','lots'),choice('Give both huts to the children','children'),
 choice('Match homes to households and improve the ground doors','choice',[{flag:'hutsObjection'}]),choice('Not yet',null),
],{
 lots:node('huts.lots',"Don't put me up there to prove it's fair. I still have knees.",'oweli',{hutsObjection:true}),
 children:node('huts.children','And what are the ground homes getting?','saluna',{hutsObjection:true}),
 choice:node('huts.choice',"Ahyeli can choose after practice. A shared refuge above; better doors below. We can ask again at review.",'kofi',{hutsAgreed:true}),
});
