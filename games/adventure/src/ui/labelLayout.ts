/** Screen-pixel label layout. Targets are centres; returned rectangles use their top-left. */
export interface LabelTarget { x: number; y: number; width: number; height: number }
export interface LabelBox extends LabelTarget { displaced: boolean }
export function overlaps(a: LabelTarget, b: LabelTarget, gap = 4): boolean {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
    && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
}

export function placeLabels(targets: LabelTarget[], bounds: { width: number; height: number }, gap = 4): LabelBox[] {
  const placed: LabelBox[] = [];
  const clamp = (value: number, max: number) => Math.max(gap, Math.min(value, Math.max(gap, max - gap)));
  for (const target of targets) {
    const width = Math.min(target.width, Math.max(0, bounds.width - 2 * gap));
    const height = Math.min(target.height, Math.max(0, bounds.height - 2 * gap));
    const desired = { x: target.x - width / 2, y: target.y - height / 2 };
    const xs = [desired.x, gap, bounds.width - width - gap];
    const ys = [desired.y, gap, bounds.height - height - gap];
    for (const other of placed) {
      xs.push(other.x - width - gap, other.x + other.width + gap);
      ys.push(other.y - height - gap, other.y + other.height + gap);
    }
    const candidates = xs.flatMap(x => ys.map(y => ({
      x: clamp(x, bounds.width - width), y: clamp(y, bounds.height - height), width, height,
    }))).sort((a, b) => Math.hypot(a.x - desired.x, a.y - desired.y) - Math.hypot(b.x - desired.x, b.y - desired.y));
    const best = candidates.find(box => placed.every(other => !overlaps(box, other, gap))) ?? candidates[0];
    placed.push({ ...best, displaced: Math.hypot(best.x - desired.x, best.y - desired.y) > 0.5 });
  }
  return placed;
}
