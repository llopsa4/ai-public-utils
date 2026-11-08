// Rough hand-lettered strokes, rather than a typeset face. Seven-unit cap height.
const CUTS: Record<string, string> = {
  A:'0,7 2,0 4,7;1,4 3,4', B:'0,7 0,0 3,0 4,1 3,3 0,3;3,3 4,5 3,7 0,7',
  C:'4,1 3,0 1,0 0,2 0,6 2,7 4,6', D:'0,7 0,0 2,0 4,2 4,5 2,7 0,7',
  E:'4,0 0,0 0,7 4,7;0,3 3,3', F:'0,7 0,0 4,0;0,3 3,3',
  G:'4,1 3,0 1,0 0,2 0,6 2,7 4,6 4,4 2,4', H:'0,0 0,7;4,0 4,7;0,3 4,3',
  I:'0,0 2,0;1,0 1,7;0,7 2,7', J:'1,0 4,0 4,6 2,7 0,6 0,5',
  K:'0,0 0,7;4,0 0,4 4,7', L:'0,0 0,7 4,7', M:'0,7 0,0 2.5,4 5,0 5,7',
  N:'0,7 0,0 4,7 4,0', O:'1,0 3,0 4,2 4,6 3,7 1,7 0,5 0,1 1,0',
  P:'0,7 0,0 3,0 4,1 4,3 3,4 0,4', Q:'1,0 3,0 4,2 4,5 3,7 1,7 0,5 0,1 1,0;2,5 5,8',
  R:'0,7 0,0 3,0 4,1 4,3 0,4;2,4 4,7', S:'4,1 3,0 1,0 0,2 1,3 3,4 4,5 3,7 1,7 0,6',
  T:'0,0 4,0;2,0 2,7', U:'0,0 0,6 1,7 3,7 4,5 4,0', V:'0,0 2,7 4,0',
  W:'0,0 1,7 3,3 5,7 6,0', X:'0,0 4,7;4,0 0,7', Y:'0,0 2,3 4,0;2,3 2,7',
  Z:'0,0 4,0 0,7 4,7', "'":'1,0 0,2', '-':'0,3 3,3', '.':'0,6 0.2,7',
  '0':'1,0 3,0 4,2 4,6 3,7 1,7 0,5 0,1 1,0;1,5 3,2',
  '1':'0,2 2,0 2,7;0,7 4,7', '2':'0,1 1,0 3,0 4,2 0,7 4,7',
  '3':'0,0 4,0 2,3 4,4 4,6 3,7 0,7', '4':'3,7 3,0 0,5 4,5',
  '5':'4,0 0,0 0,3 3,3 4,5 3,7 0,7', '6':'4,0 1,1 0,4 0,6 1,7 3,7 4,5 3,3 0,3',
  '7':'0,0 4,0 1,7', '8':'1,0 3,0 4,2 0,5 1,7 3,7 4,5 0,2 1,0',
  '9':'4,4 1,4 0,2 1,0 3,0 4,1 4,5 2,7 0,7', '?':'0,1 1,0 3,0 4,2 2,4;2,6 2,7',
};
const glyphs = Object.fromEntries(Object.entries(CUTS).map(([letter, cuts]) => {
  const paths = cuts.split(';').map(path => path.split(' ').map(point => point.split(',').map(Number)));
  return [letter, { paths, width: Math.max(...paths.flat().map(p => p[0])) + 1.7 }];
}));
const letters = (text: string) => [...text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[’‘]/g, "'")];
const advance = (c: string) => c === ' ' ? 3 : (glyphs[c] ?? glyphs['?']).width;
export const carvedWidth = (text: string) => letters(text).reduce((sum, c) => sum + advance(c), 0);

/** Knife-scratched wood or powdery chalk on metal, with the same untrained hand. */
export function carveLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, unit: number, chalk: boolean): void {
  const chars = letters(text);
  let pen = x - carvedWidth(text) * unit / 2;
  chars.forEach((c, index) => {
    const seed = (c.charCodeAt(0) * 19 + index * 37 + text.length * 11) % 101;
    if (c !== ' ') {
      ctx.save();
      ctx.translate(pen, y - 3.5 * unit + ((seed % 5) - 2) * unit * 0.14);
      ctx.transform(1, 0, ((seed % 7) - 3) * 0.035, 0.95 + (seed % 4) * 0.025, 0, 0);
      ctx.lineCap = chalk ? 'round' : 'butt'; ctx.lineJoin = chalk ? 'round' : 'miter';
      (glyphs[c] ?? glyphs['?']).paths.forEach((points, stroke) => {
        // Different pressure and slight slips for each cut; stable between visits and frames.
        const width = unit * ((chalk ? 0.6 : 0.43) + ((seed + stroke * 7) % 5) * 0.045);
        const trace = (offset: number) => {
          ctx.beginPath();
          points.forEach(([px, py], i) => {
            const dx = px * unit + ((seed + i * 13 + stroke) % 3 - 1) * unit * 0.07;
            const dy = py * unit + offset;
            if (i) ctx.lineTo(dx, dy); else ctx.moveTo(dx, dy);
          });
          ctx.stroke();
        };
        if (chalk) {
          // A faint powder fringe, without the wood's light/dark carved bevel.
          ctx.strokeStyle = '#eee4c9'; ctx.globalAlpha = 0.18;
          ctx.lineWidth = width + unit * 0.5; trace(0);
          ctx.globalAlpha = 0.88; ctx.lineWidth = width; trace(0);
          ctx.globalAlpha = 1;
          points.slice(1).forEach(([px, py], segment) => {
            const [ax, ay] = points[segment];
            for (let grain = 1; grain < 5; grain++) {
              const f = grain / 5, s = seed + segment * 11 + grain * 7 + stroke;
              ctx.fillStyle = s % 3 ? '#4a4439' : '#faf0d5';
              ctx.globalAlpha = s % 3 ? 0.3 : 0.6;
              const d = unit * 0.22;
              ctx.fillRect((ax + (px - ax) * f) * unit + ((s % 5) - 2) * unit * 0.12,
                (ay + (py - ay) * f) * unit, d, d);
            }
          });
          ctx.globalAlpha = 1;
        } else {
          ctx.strokeStyle = '#ddb27b'; ctx.lineWidth = width + unit * 0.16; trace(unit * 0.18);
          ctx.strokeStyle = '#301b10'; ctx.lineWidth = width; trace(0);
        }
        if (!chalk && (seed + stroke) % 4 === 0) {
          const [px, py] = points[0];
          ctx.beginPath(); ctx.moveTo(px * unit, py * unit);
          ctx.lineTo((px + 0.45) * unit, (py - 0.35) * unit);
          ctx.lineWidth = unit * 0.22; ctx.stroke();
        }
      });
      ctx.restore();
    }
    pen += advance(c) * unit;
  });
}
