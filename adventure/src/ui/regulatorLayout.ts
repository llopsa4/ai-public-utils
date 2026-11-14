/** Fit artwork into its measured free region; compact controls occupy a separate region. */
export function fitRegulatorBoard(width:number,height:number):{width:number;height:number}{
 const fitted=Math.max(0,Math.min(width,height*1.6));return {width:fitted,height:fitted/1.6};
}
export function compactRegulatorControls(dialogWidth:number,viewportHeight:number):boolean{
 return dialogWidth<560||viewportHeight<=520;
}
