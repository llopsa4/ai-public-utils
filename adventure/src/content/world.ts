// The invented world on the notebook's map (STORY.md, "The world map"): its places, where they sit
// on a 1000x700 map, and the land the placeholder drawing shows until Codex's painted map arrives
// (art/src/ui/world-map.png, no lettering: the game writes the names and the marker over it).

export const MAP_SIZE = { w: 1000, h: 700 } as const;

export interface Place {
  /** String key of its name. */
  name: string;
  x: number;
  y: number;
  /** Towns get a larger mark than sites (a tunnel mouth, a lone house). */
  kind: 'town' | 'site';
  /** Which side of the mark its name goes (default right), so names stay on the map and apart. */
  label?: 'left' | 'right' | 'above' | 'below';
}

/** Where a place's name sits: its position and text anchor beside the mark. */
export function labelAt(p: Place): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  switch (p.label ?? 'right') {
    case 'left': return { x: p.x - 14, y: p.y + 7, anchor: 'end' };
    case 'above': return { x: p.x, y: p.y - 16, anchor: 'middle' };
    case 'below': return { x: p.x, y: p.y + 30, anchor: 'middle' };
    default: return { x: p.x + 14, y: p.y + 7, anchor: 'start' };
  }
}

/**
 * Every place on the map, on its landmark in Codex's painting (art/src/ui/world-map.png). The map
 * names only those the viewpoint character knows.
 */
export const PLACES: Record<string, Place> = {
  // West of the Rift: the ash plains and the snowy north.
  cinderfold: { name: 'place.cinderfold', x: 185, y: 407, kind: 'town', label: 'left' },
  ashways: { name: 'place.ashways', x: 293, y: 470, kind: 'site', label: 'below' },
  tunnels: { name: 'place.tunnels', x: 318, y: 357, kind: 'site', label: 'below' },
  temperingHouse: { name: 'place.temperingHouse', x: 425, y: 295, kind: 'site', label: 'above' },
  ironhaven: { name: 'place.ironhaven', x: 300, y: 125, kind: 'town' },
  coppersong: { name: 'place.coppersong', x: 440, y: 215, kind: 'town' },
  // The only crossing.
  spanwick: { name: 'place.spanwick', x: 548, y: 368, kind: 'town', label: 'below' },
  // East of the Rift.
  valley: { name: 'place.valley', x: 660, y: 262, kind: 'site', label: 'above' },
  alderweir: { name: 'place.alderweir', x: 728, y: 420, kind: 'town', label: 'left' },
  kofiWoods: { name: 'place.kofiWoods', x: 785, y: 565, kind: 'town', label: 'left' },
  firstHearth: { name: 'place.firstHearth', x: 880, y: 290, kind: 'town', label: 'below' },
  garranHut: { name: 'place.garranHut', x: 832, y: 127, kind: 'site', label: 'left' },
};

/** The land, for the placeholder map (and the layout image Codex paints from). */
export const LAND = {
  /** The continent's coast. */
  coast: 'M60,90 C140,40 300,30 420,55 C520,70 600,40 700,50 C820,60 930,80 950,170 C975,260 940,330 960,420 C975,520 930,620 820,660 C700,690 560,665 440,675 C320,685 180,670 110,610 C50,560 70,470 45,380 C25,290 20,170 60,90 Z',
  /** The Rift: the great chasm between the two regions, crossed only at Spanwick. */
  rift: 'M572,52 L556,120 L578,190 L550,260 L574,330 L552,410 L576,480 L550,560 L570,668',
  /** Alderweir's river, from the north-eastern mountains to the south coast. */
  river: 'M820,140 C790,220 760,300 760,380 C760,430 740,460 735,470 C725,520 700,580 690,668',
  /** The road the regulator travels: Cinderfold, the tunnels, Bryn's house, the bridge, the First Hearth. */
  road: 'M215,455 L275,500 L330,420 L440,340 L500,385 L560,410 L620,380 L660,300 L760,320 L880,330',
  /** The snow around Ironhaven. */
  snow: 'M90,95 C200,60 380,60 470,90 C460,150 420,190 330,195 C230,200 140,180 90,150 Z',
  /** Hills around Coppersong (peaks). */
  hills: [[420, 215], [445, 200], [480, 210], [500, 235], [425, 255]] as [number, number][],
  /** Mountains in the north-east (peaks). */
  mountains: [[800, 95], [835, 120], [880, 80], [915, 125], [790, 150], [900, 160]] as [number, number][],
  /** The forest around Kofi's settlement (trees). */
  forest: [[770, 575], [790, 560], [815, 575], [835, 600], [780, 620], [810, 630], [840, 640], [760, 600]] as [number, number][],
  /** The ash plains around Cinderfold (specks). */
  ash: [[180, 420], [240, 470], [300, 470], [320, 520], [200, 390], [250, 400], [160, 480], [230, 530]] as [number, number][],
};
