import type { Pose } from '../engine/types';

/** World-space silhouette at full scale; machine profiles need no human skeleton. */
export interface ActorGeometry { w: number; h: number; shadowH: number }
const HUMAN: Record<Pose, ActorGeometry> = {
  stand: { w: 62, h: 116, shadowH: 11 },
  crouch: { w: 70, h: 96, shadowH: 11 },
  dead: { w: 116, h: 64, shadowH: 16 },
};
export function actorGeometry(pose: Pose, scale = 1, profile?: ActorGeometry): ActorGeometry {
  const body = profile ?? HUMAN[pose];
  return { w: body.w * scale, h: body.h * scale, shadowH: body.shadowH * scale };
}
