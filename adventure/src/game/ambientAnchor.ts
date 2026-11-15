import type { Point } from '../engine/types';

/** Upper visible silhouette of one frame, before atlas trimming or sprite transforms. */
export function opaqueHeadAnchor(pixels: ArrayLike<number>, width: number, height: number): Point | null {
  let top=-1;
  for(let y=0;y<height&&top<0;y++)for(let x=0;x<width;x++){
    if(pixels[(y*width+x)*4+3]>=128){top=y;break;}
  }
  if(top<0)return null;
  // Use a shallow band so a leaning person's head, rather than the whole body's centre,
  // determines x. This also naturally follows the top of a compact machine.
  let sum=0,count=0;
  for(let y=top;y<Math.min(height,top+8);y++)for(let x=0;x<width;x++){
    if(pixels[(y*width+x)*4+3]>=128){sum+=x+.5;count++;}
  }
  return {x:sum/count,y:top};
}

/** Current frame's painted head transformed into world coordinates, including left-facing art. */
export function ambientAnchorWorld(point: Point, frame: {width:number;height:number;trimX:number;trimY:number},
  sprite: {x:number;y:number;originX:number;originY:number;scaleX:number;scaleY:number;flipX:boolean;flipY:boolean}): Point {
  let x=point.x+frame.trimX,y=point.y+frame.trimY;
  if(sprite.flipX)x=frame.width-x;
  if(sprite.flipY)y=frame.height-y;
  return {x:sprite.x+(x-sprite.originX*frame.width)*sprite.scaleX,
    y:sprite.y+(y-sprite.originY*frame.height)*sprite.scaleY};
}
