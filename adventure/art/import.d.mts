export declare function importArt(root?: string): Promise<string[]>;
export declare const GRID: number;
export declare function keyMagenta(data: Buffer): Buffer;
export declare function toGrid(img: { data: Buffer; width: number; height: number }, options?: { outline?: boolean; dither?: boolean }): { data: Buffer; width: number; height: number };
