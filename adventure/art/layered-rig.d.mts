import type { PNG } from 'pngjs';
export type Vec = [number, number];
export type Matrix = [number, number, number, number, number, number];
export interface LayeredConfig {
  version: number; outfit: string; canvas: { width: number; height: number }; height: number;
  baseline: number; sourceHeight: number; overlap: number; order: string[]; joints: Record<string, Vec>;
  walk: { frames: number; contactFrames: number[]; hipSwing: number; armSwing: number; lift: number; strideSource: number; torsoLeanDegrees?: number; widthScale?: number;
    footRollDegrees?: number; hipSwayDegrees?: number; torsoSwayDegrees?: number; weightDrop?: number; gauntletSwingScale?: number; gauntletLagDegrees?: number; transitionMs?: number;
    soles?: Record<string, { heel: Vec; toe: Vec }> };
}
export interface LayeredPack { cfg: LayeredConfig; layers: Record<string, PNG>; master: PNG; dir: string; idle?: PNG }
export const PARTS: string[];
export function loadPack(dir: string): LayeredPack;
export function compositeNeutral(pack: Pick<LayeredPack, 'cfg' | 'layers'>): PNG;
export function mul(a: Matrix, b: Matrix): Matrix;
export function point(m: Matrix, p: Vec): Vec;
export function solveLeg(hip: Vec, target: Vec, thighLength: number, shinLength: number): Vec;
export function walkPose(cfg: LayeredConfig, phase: number): { mats: Record<string, Matrix>; feet: Record<string, { ankle: Vec; planted: boolean; contact: Vec; contactSource: Vec }>; knees: Record<string, Vec>; bodyDrop: number };
export function walkMetadata(cfg: LayeredConfig): { distancePerFrame: number; plantFrames: number[]; transitionMs?: number };
export function partWidthTransform(cfg: LayeredConfig, name: string): Matrix;
export function renderPackFrame(pack: LayeredPack, options?: { phase?: number | null; blink?: boolean; powered?: boolean }): PNG;
export function buildLayeredCharacter(id: string, cfg: { layeredPack: string; powered?: boolean }): Promise<unknown>;
