// Reproducible extraction and palette snapping of the built-in imagegen sheet.
// Run from games/zombie. Does not install or change approved art.
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const dir = 'art/inbox/A2-review';
const src = PNG.sync.read(readFileSync(`${dir}/source.png`));
const palette = JSON.parse(readFileSync('art/palette.json', 'utf8')).map(h => [1,3,5].map(i => parseInt(h.slice(i,i+2),16)));
const cell = src.width / 4;
const cellY = src.height / 4;
const rows = [['walk','se'],['walk','ne'],['run','se'],['run','ne']];
const outdir = 'art/inbox/A2/fighter';
mkdirSync(outdir, { recursive:true });
const sheet = new PNG({width:256,height:256});
const checks = [];
for (let row=0; row<4; row++) {
  let top=Infinity, bottom=-Infinity;
  for (let y=Math.ceil(row*cellY); y<Math.floor((row+1)*cellY); y++) for(let x=0;x<src.width;x++) {
    if(src.data[(y*src.width+x)*4+3]>=160) { top=Math.min(top,y-row*cellY); bottom=Math.max(bottom,y-row*cellY); }
  }
  // One shared scale/translation for the entire cycle preserves gait and airborne phases.
  const scale=48/(bottom-top+1);
  for(let col=0;col<4;col++) {
    const frame=new PNG({width:64,height:64});
    let minX=64,minY=64,maxX=-1,maxY=-1;
    for(let y=0;y<64;y++) for(let x=0;x<64;x++) {
      const sx=Math.floor((col+.5)*cell+(x-32)/scale);
      const sy=Math.floor(row*cellY+bottom+(y-56)/scale);
      if(sx<col*cell || sx>=(col+1)*cell || sy<row*cellY || sy>=(row+1)*cellY) continue;
      const i=(sy*src.width+sx)*4;
      if(src.data[i+3]<160) continue;
      let best=palette[0],dist=Infinity;
      for(const rgb of palette) {
        const d=rgb.reduce((v,c,k)=>v+(c-src.data[i+k])**2,0);
        if(d<dist){best=rgb;dist=d;}
      }
      const j=(y*64+x)*4;
      frame.data.set([...best,255],j);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    const name=`${rows[row][0]}_${rows[row][1]}_${col}.png`;
    writeFileSync(`${outdir}/${name}`,PNG.sync.write(frame));
    PNG.bitblt(frame,sheet,0,0,64,64,col*64,row*64);
    checks.push({name,bounds:[minX,minY,maxX,maxY],scale,anchor:[32,56]});
  }
}
writeFileSync(`${dir}/sheet.png`,PNG.sync.write(sheet));
const enlarged=new PNG({width:1024,height:1024});
for(let y=0;y<1024;y++) for(let x=0;x<1024;x++) {
  const i=(Math.floor(y/4)*256+Math.floor(x/4))*4,j=(y*1024+x)*4;
  enlarged.data.set(sheet.data.subarray(i,i+4),j);
}
writeFileSync(`${dir}/contact.png`,PNG.sync.write(enlarged));
writeFileSync(`${dir}/checks.json`,JSON.stringify({source:[src.width,src.height],frames:checks},null,2)+'\n');
console.log(JSON.stringify(checks));
