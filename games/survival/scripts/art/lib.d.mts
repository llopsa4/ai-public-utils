export interface Frame {
  name: string;
  file: string;
  layer: string | null;
  size: [number, number];
}
export const FACINGS: string[];
export const SEASONS: string[];
export const GROUPS: string[];
export const KINDS: string[];
export function expectedFrames(key: string, entry: unknown): Frame[];
export function deliveryFrames(key: string, entry: unknown, batch?: string): Frame[];
export function validateManifest(manifest: Record<string, unknown>): string[];
export function validateInbox(artDir: string, batch: string, manifest: Record<string, unknown>): { errors: string[]; frames: number };
