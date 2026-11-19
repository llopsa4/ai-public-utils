// The asset manifest (art/manifest.json, format in art/SPEC.md). The game loads an art PNG when an
// entry is `final` and the file exists, else it draws the code placeholder.
import raw from '../../art/manifest.json';

export interface ManifestEntry {
  file: string;
  size: [number, number];
  anchor: [number, number];
  frames: Record<string, number>;
  status: 'placeholder' | 'final';
}

export const manifest = raw as unknown as Record<string, ManifestEntry>;

export function entry(key: string): ManifestEntry {
  const e = manifest[key];
  if (!e) throw new Error(`Unknown art key: ${key}`);
  return e;
}
