import type Phaser from 'phaser';
import { circlePoints } from '../render/cones';
import { tileToWorld } from '../render/iso';
import { BOND, bondAim } from '../sim/bond';
import type { MissionState } from '../sim/mission';
import type { ViewInput } from './input';

// The bond move on screen (DESIGN §23), shared by Mission 1 and Base 1: the aim circle that follows the
// pointer with the marked zombies, and the short camera follow while the set piece plays.

const OK = 0xe8c46a;
const NO = 0xa0a098;

/** The aim circle at `centre` (tile space) and a ring under each zombie it marks; grey when a click would be refused. */
export function drawBondAim(g: Phaser.GameObjects.Graphics, s: MissionState, n: number, centre: readonly [number, number]): void {
  const aim = bondAim(s, centre);
  const color = aim.refusal === null ? OK : NO;
  const w = (pts: [number, number][]) => pts.map(([x, y]) => tileToWorld(x, y, n));
  const circle = w(circlePoints(centre[0], centre[1], BOND.radius, 40));
  g.fillStyle(color, 0.08).fillPoints(circle, true);
  g.lineStyle(2, color, 0.85).strokePoints(circle, true);
  for (const id of aim.targets) {
    const e = s.enemies.find((z) => z.id === id);
    if (!e) continue;
    const ring = w(circlePoints(e.x, e.y, 0.6, 16));
    g.fillStyle(color, 0.3).fillPoints(ring, true);
    g.lineStyle(2, color, 1).strokePoints(ring, true);
  }
}

/** While the set piece plays, the camera eases toward the midpoint of Cass and Eli. */
export function followBond(view: ViewInput, s: MissionState, n: number): void {
  if (!s.bond?.run) return;
  const pair = s.survivors.filter((u) => u.hp > 0 && (u.kind === 'fighter' || u.kind === 'scout'));
  if (pair.length === 0) return;
  const mx = pair.reduce((a, u) => a + u.x, 0) / pair.length;
  const my = pair.reduce((a, u) => a + u.y, 0) / pair.length;
  const t = tileToWorld(mx, my, n);
  const [cx, cy] = view.centre;
  view.centreOn(cx + (t.x - cx) * 0.08, cy + (t.y - 22 - cy) * 0.08);
}
