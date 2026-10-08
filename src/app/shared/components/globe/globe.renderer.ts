import {
  CENTER_X,
  CENTER_Y,
  GLOBE_EDGES,
  GLOBE_NODES,
  HUB_INDEX,
  LATITUDE_SINES,
  MERIDIAN_LONGITUDES,
  PALETTE,
  SPHERE_RADIUS,
  VIEWBOX_SIZE,
} from './globe.data';
import { project, smoothstep } from './globe.math';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
export const NODE_INDEX_ATTRIBUTE = 'data-node';
export const NODE_GLOW_FILTER_ID = 'globe-node-glow';
export const NO_NODE_FOCUSED = -1;

const LATITUDE_ELLIPSE_FLATTENING = 0.32;
const NODE_HALO_SCALE = 2.2;
const NODE_CORE_SCALE = 0.45;
const NODE_HIT_RADIUS = 16;
const HIT_AREA_MIN_FADE = 0.5;
const DIMMED_NODE_OPACITY = 0.55;
const FOCUS_NODE_SCALE = 1.6;
const NEIGHBOR_NODE_SCALE = 1.2;
const EDGE_BASE_OPACITY = 0.5;
const EDGE_BASE_WIDTH = 0.9;
const EDGE_FOCUS_WIDTH = 1.9;
const LABEL_FONT_SIZE = 14;
const LABEL_PADDING_X = 10;
const LABEL_PADDING_Y = 6;
const LABEL_GAP_ABOVE_NODE = 14;
const LABEL_EDGE_MARGIN = 6;

export interface GlobeLayers {
  readonly latitudes: SVGGElement;
  readonly meridians: SVGGElement;
  readonly edges: SVGGElement;
  readonly nodes: SVGGElement;
  readonly pulse: SVGGElement;
  readonly label: SVGGElement;
}

export interface GlobeViewState {
  readonly angle: number;
  /** Index of the hovered or selected node, or -1 when none. */
  readonly focusIndex: number;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  return element;
}

interface NodeElements {
  readonly group: SVGGElement;
  readonly hitArea: SVGCircleElement;
}

interface LabelElements {
  readonly background: SVGRectElement;
  readonly text: SVGTextElement;
}

/** Owns every SVG element of the globe and repaints them for a given rotation and focus. */
export class GlobeRenderer {
  private readonly meridianElements: { element: SVGEllipseElement; lon: number }[] = [];
  private readonly nodeElements: NodeElements[] = [];
  private readonly edgeElements: SVGLineElement[] = [];
  private readonly pulseRings: SVGCircleElement[] = [];
  private label!: LabelElements;
  private lastLabelText = '';
  private labelSize = { width: 0, height: 0 };

  constructor(
    private readonly layers: GlobeLayers,
    private readonly translate: (key: string) => string,
  ) {}

  build(): void {
    this.buildLatitudes();
    this.buildMeridians();
    this.buildEdges();
    this.buildNodes();
    this.buildPulse();
    this.buildLabel();
  }

  render({ angle, focusIndex }: GlobeViewState): void {
    const points = GLOBE_NODES.map(({ lon, lat }) => project(lon, lat, angle));
    this.renderMeridians(angle);
    this.renderEdges(points, focusIndex);
    this.renderNodes(points, focusIndex);
    this.renderPulse(points[HUB_INDEX]);
    this.renderLabel(points, focusIndex);
  }

  private buildLatitudes(): void {
    for (const sine of LATITUDE_SINES) {
      const cosine = Math.sqrt(1 - sine * sine);
      this.layers.latitudes.appendChild(
        createSvgElement('ellipse', {
          cx: CENTER_X,
          cy: CENTER_Y - sine * SPHERE_RADIUS,
          rx: cosine * SPHERE_RADIUS,
          ry: cosine * SPHERE_RADIUS * LATITUDE_ELLIPSE_FLATTENING,
          fill: 'none',
          stroke: PALETTE.tealLight,
          'stroke-width': 0.6,
          opacity: 0.3,
        }),
      );
    }
  }

  private buildMeridians(): void {
    for (const lon of MERIDIAN_LONGITUDES) {
      const element = createSvgElement('ellipse', {
        cx: CENTER_X,
        cy: CENTER_Y,
        rx: 0,
        ry: SPHERE_RADIUS,
        fill: 'none',
        stroke: PALETTE.tealLight,
      });
      this.layers.meridians.appendChild(element);
      this.meridianElements.push({ element, lon });
    }
  }

  private buildEdges(): void {
    for (let i = 0; i < GLOBE_EDGES.length; i++) {
      const element = createSvgElement('line', { stroke: PALETTE.tealLight, opacity: 0 });
      this.layers.edges.appendChild(element);
      this.edgeElements.push(element);
    }
  }

  private buildNodes(): void {
    GLOBE_NODES.forEach(({ radius }, index) => {
      const group = createSvgElement('g', { [NODE_INDEX_ATTRIBUTE]: index });
      const hitArea = createSvgElement('circle', { r: NODE_HIT_RADIUS, fill: 'transparent' });
      group.append(
        hitArea,
        createSvgElement('circle', { r: radius * NODE_HALO_SCALE, fill: PALETTE.tealLight, opacity: 0.3 }),
        createSvgElement('circle', { r: radius, fill: PALETTE.tealLight }),
        createSvgElement('circle', { r: radius * NODE_CORE_SCALE, fill: PALETTE.core }),
      );
      this.layers.nodes.appendChild(group);
      this.nodeElements.push({ group, hitArea });
    });
  }

  private buildPulse(): void {
    const rings: [number, number, string][] = [
      [16, 0.8, 'globe-pulse-1'],
      [26, 0.5, 'globe-pulse-2'],
    ];
    for (const [radius, strokeWidth, animationClass] of rings) {
      const ring = createSvgElement('circle', { r: radius, fill: 'none', stroke: PALETTE.tealLight, 'stroke-width': strokeWidth });
      ring.classList.add(animationClass);
      this.layers.pulse.appendChild(ring);
      this.pulseRings.push(ring);
    }
  }

  private buildLabel(): void {
    const background = createSvgElement('rect', {
      rx: 6,
      fill: PALETTE.deep,
      'fill-opacity': 0.92,
      stroke: PALETTE.tealLight,
      'stroke-width': 1,
    });
    const text = createSvgElement('text', {
      fill: PALETTE.core,
      'font-size': LABEL_FONT_SIZE,
      'font-weight': 600,
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
    });
    this.layers.label.append(background, text);
    this.layers.label.setAttribute('opacity', '0');
    this.label = { background, text };
  }

  private renderMeridians(angle: number): void {
    for (const { element, lon } of this.meridianElements) {
      const turned = lon + angle;
      const front = smoothstep(-0.08, 0.08, Math.cos(turned));
      element.setAttribute('rx', String(SPHERE_RADIUS * Math.abs(Math.sin(turned))));
      element.setAttribute('opacity', String(0.12 + 0.6 * front));
      element.setAttribute('stroke-width', String(0.5 + 0.5 * front));
    }
  }

  private renderEdges(points: ReturnType<typeof project>[], focusIndex: number): void {
    GLOBE_EDGES.forEach(([from, to], i) => {
      const start = points[from];
      const end = points[to];
      const visibility = smoothstep(-SPHERE_RADIUS * 0.6, -SPHERE_RADIUS * 0.3, (start.z + end.z) / 2);
      const isFocused = focusIndex === from || focusIndex === to;
      const element = this.edgeElements[i];
      element.setAttribute('x1', String(start.sx));
      element.setAttribute('y1', String(start.sy));
      element.setAttribute('x2', String(end.sx));
      element.setAttribute('y2', String(end.sy));
      element.setAttribute('stroke-width', String(isFocused ? EDGE_FOCUS_WIDTH : EDGE_BASE_WIDTH));
      element.setAttribute('opacity', String((isFocused ? 1 : EDGE_BASE_OPACITY) * visibility));
    });
  }

  private renderNodes(points: ReturnType<typeof project>[], focusIndex: number): void {
    points.forEach(({ sx, sy, z }, index) => {
      const { group, hitArea } = this.nodeElements[index];
      const depth = (z / SPHERE_RADIUS + 1) / 2;
      const horizonFade = smoothstep(-SPHERE_RADIUS * 0.12, SPHERE_RADIUS * 0.12, z);
      const emphasis = this.nodeEmphasis(index, focusIndex);
      group.setAttribute('transform', `translate(${sx} ${sy}) scale(${(0.75 + 0.4 * depth) * emphasis.scale})`);
      group.setAttribute('opacity', String(horizonFade * emphasis.opacity));
      hitArea.setAttribute('pointer-events', horizonFade > HIT_AREA_MIN_FADE ? 'all' : 'none');
    });
  }

  private nodeEmphasis(index: number, focusIndex: number): { scale: number; opacity: number } {
    if (focusIndex === NO_NODE_FOCUSED) return { scale: 1, opacity: 1 };
    if (index === focusIndex) return { scale: FOCUS_NODE_SCALE, opacity: 1 };
    const isNeighbor = GLOBE_EDGES.some(([from, to]) => (from === focusIndex && to === index) || (to === focusIndex && from === index));
    return isNeighbor ? { scale: NEIGHBOR_NODE_SCALE, opacity: 1 } : { scale: 1, opacity: DIMMED_NODE_OPACITY };
  }

  private renderPulse(hub: ReturnType<typeof project>): void {
    const horizonFade = smoothstep(-SPHERE_RADIUS * 0.12, SPHERE_RADIUS * 0.12, hub.z);
    this.layers.pulse.setAttribute('opacity', String(horizonFade));
    for (const ring of this.pulseRings) {
      ring.setAttribute('cx', String(hub.sx));
      ring.setAttribute('cy', String(hub.sy));
    }
  }

  private renderLabel(points: ReturnType<typeof project>[], focusIndex: number): void {
    if (focusIndex === NO_NODE_FOCUSED) {
      this.layers.label.setAttribute('opacity', '0');
      return;
    }
    const { sx, sy, z } = points[focusIndex];
    const text = this.translate(GLOBE_NODES[focusIndex].labelKey);
    this.measureLabel(text);
    const { width, height } = this.labelSize;
    const halfWidth = width / 2;
    const centerX = Math.min(Math.max(sx, halfWidth + LABEL_EDGE_MARGIN), VIEWBOX_SIZE - halfWidth - LABEL_EDGE_MARGIN);
    const centerY = sy - GLOBE_NODES[focusIndex].radius * FOCUS_NODE_SCALE - LABEL_GAP_ABOVE_NODE - height / 2;

    this.label.background.setAttribute('x', String(centerX - halfWidth));
    this.label.background.setAttribute('y', String(centerY - height / 2));
    this.label.text.setAttribute('x', String(centerX));
    this.label.text.setAttribute('y', String(centerY));
    this.layers.label.setAttribute('opacity', String(smoothstep(-SPHERE_RADIUS * 0.12, SPHERE_RADIUS * 0.12, z)));
  }

  private measureLabel(text: string): void {
    if (text === this.lastLabelText) return;
    this.lastLabelText = text;
    this.label.text.textContent = text;
    const box = this.label.text.getBBox();
    this.labelSize = { width: box.width + LABEL_PADDING_X * 2, height: box.height + LABEL_PADDING_Y * 2 };
    this.label.background.setAttribute('width', String(this.labelSize.width));
    this.label.background.setAttribute('height', String(this.labelSize.height));
  }
}
