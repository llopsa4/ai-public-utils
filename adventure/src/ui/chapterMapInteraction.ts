/** Click and keyboard activation both select an unplayed chapter immediately. */
export function mapPinSelection(played:boolean):{activate:boolean}{
 return {activate:!played};
}
interface Size {width:number;height:number}
interface Anchor extends Size {x:number;y:number}
/** Position full HTML text boxes, rather than clipping SVG glyphs to a plate. */
export function mapTooltipPosition(container:Size,anchor:Anchor,tooltip:Size):{x:number;y:number}{
 const inset=8,gap=8;
 const clamp=(n:number,size:number,limit:number)=>Math.max(inset,Math.min(n,limit-inset-size));
 const above=anchor.y-gap-tooltip.height;
 return {x:clamp(anchor.x+anchor.width/2-tooltip.width/2,tooltip.width,container.width),y:clamp(above>=inset?above:anchor.y+anchor.height+gap,tooltip.height,container.height)};
}
