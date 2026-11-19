/** Kofi's deterministic six-card encounters. No gauntlet, loot, or implicit finishing blow. */
export type ArcheryAction='shot'|'aim'|'step'|'fire'|'huska'|'gather';
export type Wildlife='wolves'|'bear';
export interface ArcheryState {
 animal:Wildlife; hp:number; threat:number; arrows:number; spent:number; stamina:number;
 turn:number; aiming:boolean; huskaReady:boolean; outcome:'active'|'won'|'defeat'; log:string;
}
export const ARCHERY_ACTIONS:readonly ArcheryAction[]=['shot','aim','step','fire','huska','gather'];
export function newArchery(animal:Wildlife):ArcheryState{
 return {animal,hp:32,threat:animal==='bear'?28:20,arrows:6,spent:0,stamina:3,turn:0,aiming:false,huskaReady:true,outcome:'active',log:animal==='bear'?'The bear rises beyond the log. Huska stays clear.':'The pack steps out beyond the firelight.'};
}
export function intent(s:ArcheryState):{name:string;damage:number}{
 if(s.animal==='bear')return s.turn%2?{name:'Charge — prepare now',damage:9}:{name:'Heavy swipe',damage:4};
 return s.turn%2?{name:'Pack rush',damage:6}:{name:'Circling bite',damage:3};
}
export function actionAvailable(s:ArcheryState,a:ArcheryAction):boolean{
 return s.outcome==='active'&&(!(a==='shot'||a==='aim')||s.arrows>0)&&(a!=='fire'||s.stamina>=2)&&(a!=='huska'||s.huskaReady);
}
export function archeryTurn(before:ArcheryState,a:ArcheryAction):ArcheryState{
 if(!actionAvailable(before,a))return before;
 const s={...before};let damage=0,block=0,cancel=false;
 const interrupted=s.aiming&&a!=='aim';
 s.aiming=false;
 switch(a){
  case 'shot':s.arrows--;s.spent++;damage=5;s.log='Shot: one arrow.';break;
  case 'aim':
   if(before.aiming){s.arrows--;s.spent++;damage=11;s.log='Aimed shot released: one arrow.';}
   else{s.aiming=true;s.log='Aimed shot prepared. No arrow fired. Choose Aimed shot again to release, or another card to cancel.';}
   break;
  case 'step':block=9;s.log='Step back: hold the cleared space.';break;
  case 'fire':s.stamina-=2;cancel=true;s.log='Fire brand: the next attack breaks off.';break;
  case 'huska':damage=2;block=6;s.huskaReady=false;s.log='Huska lunges, then returns safely to heel.';break;
  case 'gather':s.arrows+=s.spent;s.spent=0;block=4;s.log='Gather spent arrows while keeping space.';break;
 }
 if(a!=='huska')s.huskaReady=true;
 s.threat=Math.max(0,s.threat-damage);
 if(!s.threat){s.outcome='won';s.aiming=false;return s;}
 s.hp=Math.max(0,s.hp-(cancel?0:Math.max(0,intent(before).damage-block)));
 s.turn++;s.stamina=Math.min(3,s.stamina+1);
 if(interrupted)s.log='Aimed shot cancelled before release. '+s.log;
 if(!s.hp)s.outcome='defeat';
 return s;
}
