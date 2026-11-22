import type { PNG } from 'pngjs';
import type { Frame } from './lib.mjs';

export function standinShape(key: string, entry: unknown, scale?: number): { shape: 'box' | 'diamond'; x0: number; y0: number; x1: number; y1: number };
export function standinImage(key: string, entry: unknown, frame: Frame, scale?: number): PNG;
export function writeStandins(manifest: Record<string, unknown>, outDir: string): number;
