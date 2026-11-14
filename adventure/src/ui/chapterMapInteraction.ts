/** Touch preview is separate from hover/focus: synthetic focus cannot start a chapter. */
export function mapPinSelection(touchPreview:string|null,id:string,played:boolean,input:'touch'|'pointer'|'keyboard'):{preview:string;activate:boolean}{
 return {preview:id,activate:!played&&(input!=='touch'||touchPreview===id)};
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
