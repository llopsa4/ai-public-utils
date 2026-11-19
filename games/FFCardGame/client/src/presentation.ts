import { openingArt, assets } from './assets';
import type { BattleState } from './game/types';

export function battleVisual(state:BattleState){
  const id=state.config.encounter.id,training=!!state.practice||id==='training-rig';
  const machine=training||id.includes('sweeper')?'sweeper':id.includes('scavenger')?'scavenger':id==='cable-warden'?'warden':'guardian';
  const sprite=machine==='sweeper'?openingArt['ash-sweeper']:machine==='scavenger'?openingArt['pressure-scavenger']:machine==='warden'?openingArt['cable-warden']:assets.guardian;
  const arena=training?openingArt['tempering-house']:machine==='warden'||id==='armored-scavenger'?openingArt['hanging-crossing']:machine!=='guardian'?openingArt.ashways:null;
  const ink=machine==='sweeper'?{height:.74707,gap:.139648}:machine==='scavenger'?{height:.958984,gap:.02832}:machine==='warden'?{height:.682617,gap:.168945}:null;
  return {machine,sprite,arena,ink,training,reinforced:id==='armored-scavenger'};
}
