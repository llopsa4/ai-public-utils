/** Fit the desktop puzzle artwork into its free region without changing its registration. */
export function fitRegulatorBoard(width:number,height:number):{width:number;height:number}{
 const fitted=Math.max(0,Math.min(width,height*1.6));return {width:fitted,height:fitted/1.6};
}
