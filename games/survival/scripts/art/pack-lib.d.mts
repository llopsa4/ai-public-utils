import type { PNG } from 'pngjs';

export interface PackedFrame {
  name: string;
  frame: { x: number; y: number; w: number; h: number };
  spriteSourceSize: { x: number; y: number; w: number; h: number };
  sourceSize: { w: number; h: number };
  trimmed: boolean;
}
export interface PackedPage {
  width: number;
  height: number;
  png: PNG;
  frames: PackedFrame[];
}
export const PAGE_SIZE: number;
export const EXTRUDE: number;
export const PADDING: number;
export const PAGE_BUDGET: number;
export function trimBox(png: PNG): { x: number; y: number; w: number; h: number };
export function packFrames(frames: { name: string; png: PNG }[], options?: { pageSize?: number; extrude?: number; padding?: number }): { pages: PackedPage[] };
export function atlasJson(group: string, packed: { pages: PackedPage[] }): {
  textures: { image: string; format: string; size: { w: number; h: number }; scale: number; frames: unknown[] }[];
};
export function packGroup(manifest: Record<string, unknown>, group: string, keys: string[], dirFor: (key: string) => string | null, outDir: string, budget?: number, batchFor?: (key: string) => string | undefined): { pages: number; frames: number; bytes: number };
