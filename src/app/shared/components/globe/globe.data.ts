export const VIEWBOX_SIZE = 520;
export const CENTER_X = 260;
export const CENTER_Y = 260;
export const SPHERE_RADIUS = 210;

export const LATITUDE_SINES = [-0.7, -0.4, -0.1, 0.1, 0.4, 0.7];
export const MERIDIAN_LONGITUDES = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, (5 * Math.PI) / 6];

export interface GlobeNode {
  /** Longitude and latitude in radians. */
  readonly lon: number;
  readonly lat: number;
  readonly radius: number;
  readonly labelKey: string;
}

export const HUB_INDEX = 5;

export const GLOBE_NODES: readonly GlobeNode[] = [
  { lon: 0.0, lat: 1.4, radius: 6, labelKey: 'globe_node_design' },
  { lon: 1.15, lat: 0.42, radius: 5, labelKey: 'globe_node_frontend' },
  { lon: 1.02, lat: -0.55, radius: 6, labelKey: 'globe_node_backend' },
  { lon: -1.1, lat: -0.57, radius: 5, labelKey: 'globe_node_android' },
  { lon: -1.12, lat: 0.45, radius: 6, labelKey: 'globe_node_ios' },
  { lon: 0.24, lat: 0.14, radius: 8, labelKey: 'globe_node_hub' },
  { lon: -0.52, lat: -0.24, radius: 5, labelKey: 'globe_node_data' },
  { lon: 0.75, lat: 0.62, radius: 4, labelKey: 'globe_node_erp' },
];

export type GlobeEdge = readonly [from: number, to: number];

export const GLOBE_EDGES: readonly GlobeEdge[] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [HUB_INDEX, 1],
  [HUB_INDEX, 2],
  [HUB_INDEX, 4],
  [HUB_INDEX, 6],
  [HUB_INDEX, 7],
  [6, 3],
  [7, 0],
];

/** Radians per second the globe turns on its own. */
export const AUTO_SPIN_SPEED = 0.18;
/** Share of the auto-spin speed kept while a node is hovered or selected. */
export const FOCUS_SPIN_FACTOR = 0.25;
/** Seconds for a flung globe to settle back to the auto-spin speed. */
export const INERTIA_SETTLE_SECONDS = 1.2;
/** Pointer travel (px) before a press becomes a drag instead of a click. */
export const DRAG_THRESHOLD_PX = 4;
/** Cap on a single frame's time step so a backgrounded tab cannot make the globe jump. */
export const MAX_FRAME_SECONDS = 0.05;
/** Highest speed (radians per second) a fling can reach. */
export const MAX_SPIN_SPEED = 6;

export const PALETTE = {
  teal: '#20B2AA',
  tealLight: '#34D3C9',
  core: '#FFFFFF',
  deep: '#002236',
} as const;
