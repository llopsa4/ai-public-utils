export declare const PALETTE: [number, number, number][];
export declare const OUTLINE: [number, number, number];
export declare function nearest(r: number, g: number, b: number): [number, number, number];
export declare function snapToPalette(data: Uint8Array, width: number, options?: { dither?: boolean }): void;
export declare function addOutline(data: Uint8Array, width: number, height: number): void;
export declare function paletteConformity(data: Uint8Array): number;
