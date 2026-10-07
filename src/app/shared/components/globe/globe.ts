import { PLATFORM_ID, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const NS = 'http://www.w3.org/2000/svg';
const CX = 260;
const CY = 260;
const R = 210;
const ROTATION_SPEED = 0.18; // radians per second (frame-rate independent)
const LAT_SINS = [-0.7, -0.4, -0.1, 0.1, 0.4, 0.7];
const MERIDIAN_LONS = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, (5 * Math.PI) / 6];
// [longitude, latitude] in radians for each talent node; index 5 is the hub.
const NODES: [number, number][] = [
  [0.0, 1.4],
  [1.15, 0.42],
  [1.02, -0.55],
  [-1.1, -0.57],
  [-1.12, 0.45],
  [0.24, 0.14],
  [-0.52, -0.24],
  [0.75, 0.62],
];
const NODE_RADII = [6, 5, 6, 5, 6, 8, 5, 4];
const HUB = 5;
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 0],
  [HUB, 1],
  [HUB, 2],
  [HUB, 4],
  [HUB, 6],
  [HUB, 7],
  [6, 3],
  [7, 0],
];

function mkEl(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e as SVGElement;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

@Component({
  selector: 'app-globe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg #svg viewBox="0 0 520 520" class="h-full w-full opacity-[0.18]" aria-hidden="true">
      <circle [attr.cx]="CX" [attr.cy]="CY" [attr.r]="R" fill="none" stroke="#20B2AA" stroke-width="1.2" />
      <g #lats></g>
      <g #mers></g>
      <g #conns></g>
      <g #nodes></g>
      <g #pulse></g>
    </svg>
  `,
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly CX = CX;
  protected readonly CY = CY;
  protected readonly R = R;

  @ViewChild('svg') private svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('lats') private latsRef!: ElementRef<SVGGElement>;
  @ViewChild('mers') private mersRef!: ElementRef<SVGGElement>;
  @ViewChild('conns') private connsRef!: ElementRef<SVGGElement>;
  @ViewChild('nodes') private nodesRef!: ElementRef<SVGGElement>;
  @ViewChild('pulse') private pulseRef!: ElementRef<SVGGElement>;

  private rafId?: number;
  private intersectionObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initGlobe();
  }

  ngOnDestroy(): void {
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
    this.intersectionObserver?.disconnect();
  }

  private initGlobe(): void {
    const latsG = this.latsRef.nativeElement;
    LAT_SINS.forEach((s) => {
      const c = Math.sqrt(1 - s * s);
      latsG.appendChild(
        mkEl('ellipse', {
          cx: CX,
          cy: CY - s * R,
          rx: c * R,
          ry: c * R * 0.32,
          fill: 'none',
          stroke: '#20B2AA',
          'stroke-width': 0.6,
        }),
      );
    });

    const mersG = this.mersRef.nativeElement;
    const merEls = MERIDIAN_LONS.map((lon) => {
      const e = mkEl('ellipse', { cx: CX, cy: CY, rx: 0, ry: R, fill: 'none', stroke: '#20B2AA', 'stroke-width': 0.6 });
      mersG.appendChild(e);
      return { e, lon };
    });

    const nodesG = this.nodesRef.nativeElement;
    const nodeEls = NODES.map((_, i) => {
      const e = mkEl('circle', { r: NODE_RADII[i], fill: '#20B2AA', opacity: 1 });
      nodesG.appendChild(e);
      return e;
    });

    const connsG = this.connsRef.nativeElement;
    const connEls = EDGES.map(() => {
      const e = mkEl('line', { stroke: '#20B2AA', 'stroke-width': 0.9, opacity: 0 });
      connsG.appendChild(e);
      return e;
    });

    const pulseG = this.pulseRef.nativeElement;
    const p1 = mkEl('circle', { r: 16, fill: 'none', stroke: '#20B2AA', 'stroke-width': 0.8 });
    const p2 = mkEl('circle', { r: 26, fill: 'none', stroke: '#20B2AA', 'stroke-width': 0.5 });
    p1.classList.add('globe-pulse-1');
    p2.classList.add('globe-pulse-2');
    pulseG.appendChild(p1);
    pulseG.appendChild(p2);

    const project = (lon: number, lat: number, angle: number) => {
      const cl = Math.cos(lat);
      const x = R * cl * Math.sin(lon + angle);
      const y = R * Math.sin(lat);
      const z = R * cl * Math.cos(lon + angle);
      return { sx: CX + x, sy: CY - y, z };
    };

    const render = (angle: number) => {
      merEls.forEach(({ e, lon }) => {
        const a = lon + angle;
        const front = smoothstep(-0.08, 0.08, Math.cos(a));
        e.setAttribute('rx', String(R * Math.abs(Math.sin(a))));
        e.setAttribute('opacity', String(0.18 + 0.67 * front));
        e.setAttribute('stroke-width', String(0.3 + 0.4 * front));
      });

      const pts = NODES.map(([lon, lat]) => project(lon, lat, angle));

      nodeEls.forEach((e, i) => {
        const { sx, sy, z } = pts[i];
        const depthT = (z / R + 1) / 2;
        const horizonFade = smoothstep(-R * 0.12, R * 0.12, z);
        e.setAttribute('cx', String(sx));
        e.setAttribute('cy', String(sy));
        e.setAttribute('r', String(NODE_RADII[i] * (0.75 + 0.4 * depthT)));
        e.setAttribute('opacity', String(horizonFade * (i === HUB ? 1 : 0.9)));
      });

      const hub = pts[HUB];
      p1.setAttribute('cx', String(hub.sx));
      p1.setAttribute('cy', String(hub.sy));
      p2.setAttribute('cx', String(hub.sx));
      p2.setAttribute('cy', String(hub.sy));

      EDGES.forEach(([a, b], i) => {
        const pa = pts[a];
        const pb = pts[b];
        const zAvg = (pa.z + pb.z) / 2;
        connEls[i].setAttribute('x1', String(pa.sx));
        connEls[i].setAttribute('y1', String(pa.sy));
        connEls[i].setAttribute('x2', String(pb.sx));
        connEls[i].setAttribute('y2', String(pb.sy));
        connEls[i].setAttribute('opacity', String(0.6 * smoothstep(-R * 0.6, -R * 0.3, zAvg)));
      });
    };

    render(0);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    let angle = 0;
    let lastTime: number | undefined;
    const frame = (time: number) => {
      if (lastTime !== undefined) {
        angle += ROTATION_SPEED * ((time - lastTime) / 1000);
      }
      lastTime = time;
      render(angle);
      this.rafId = requestAnimationFrame(frame);
    };

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        if (visible && this.rafId === undefined) {
          lastTime = undefined;
          this.rafId = requestAnimationFrame(frame);
        } else if (!visible && this.rafId !== undefined) {
          cancelAnimationFrame(this.rafId);
          this.rafId = undefined;
        }
      },
      { threshold: 0 },
    );
    this.intersectionObserver.observe(this.svgRef.nativeElement);

    this.rafId = requestAnimationFrame(frame);
  }
}
