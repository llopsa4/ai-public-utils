import type { Command, GameState } from '../../engine/types';

/** Temporary geometric pose only. No rig or finished character art is installed. */
export const BOW_DRAW_SHEET='kofi-test-bow-drawn';
export const BOW_DRAW_FRAME=224;
export const BOW_DRAW_HOLD_MS=900;

export function drawBow(state:GameState,targetX:number):Command[]{
 const face=targetX<state.hero.x?'left':'right';
 return [
  {type:'face',actor:'hero',face},
  {type:'heroLayers',sheet:BOW_DRAW_SHEET,origin:{x:BOW_DRAW_FRAME/2,y:BOW_DRAW_FRAME},
   layers:[{frame:face==='left'?'frame1':'frame0',depth:325}],ms:BOW_DRAW_HOLD_MS},
 ];
}
