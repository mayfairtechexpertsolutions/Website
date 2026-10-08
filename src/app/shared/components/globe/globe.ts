import { PLATFORM_ID, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../../core/i18n/translation.service';
import {
  AUTO_SPIN_SPEED,
  CENTER_X,
  CENTER_Y,
  DRAG_THRESHOLD_PX,
  FOCUS_SPIN_FACTOR,
  MAX_FRAME_SECONDS,
  PALETTE,
  SPHERE_RADIUS,
  VIEWBOX_SIZE,
} from './globe.data';
import { clampSpinSpeed, dragToAngle, easeSpinSpeed } from './globe.math';
import { GlobeRenderer, NODE_GLOW_FILTER_ID, NODE_INDEX_ATTRIBUTE, NO_NODE_FOCUSED } from './globe.renderer';

const SPHERE_FILL_ID = 'globe-sphere-fill';
/** Milliseconds a pointer may rest before releasing without flinging the globe. */
const FLING_MAX_IDLE_MS = 100;
const FLING_SMOOTHING = 0.5;

interface Press {
  readonly pointerId: number;
  readonly startX: number;
  readonly startY: number;
  readonly pixelsToViewbox: number;
  lastX: number;
  lastTime: number;
  dragging: boolean;
}

@Component({
  selector: 'app-globe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block size-full' },
  template: `
    <svg #svg viewBox="0 0 520 520" class="h-full w-full cursor-grab touch-pan-y select-none" aria-hidden="true">
      <defs>
        <radialGradient [attr.id]="SPHERE_FILL_ID" cx="50%" cy="50%" r="50%">
          <stop offset="0%" [attr.stop-color]="palette.deep" stop-opacity="0.7" />
          <stop offset="75%" [attr.stop-color]="palette.deep" stop-opacity="0.35" />
          <stop offset="100%" [attr.stop-color]="palette.tealLight" stop-opacity="0.28" />
        </radialGradient>
        <filter [attr.id]="NODE_GLOW_FILTER_ID" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle [attr.cx]="CX" [attr.cy]="CY" [attr.r]="R" [attr.fill]="'url(#' + SPHERE_FILL_ID + ')'" />
      <circle [attr.cx]="CX" [attr.cy]="CY" [attr.r]="R" fill="none" [attr.stroke]="palette.tealLight" stroke-width="1.6" opacity="0.9" />
      <g #lats></g>
      <g #mers></g>
      <g #conns [attr.filter]="'url(#' + NODE_GLOW_FILTER_ID + ')'"></g>
      <g #pulse></g>
      <g #nodes [attr.filter]="'url(#' + NODE_GLOW_FILTER_ID + ')'"></g>
      <g #label class="pointer-events-none"></g>
    </svg>
  `,
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly i18n = inject(TranslationService);

  protected readonly CX = CENTER_X;
  protected readonly CY = CENTER_Y;
  protected readonly R = SPHERE_RADIUS;
  protected readonly SPHERE_FILL_ID = SPHERE_FILL_ID;
  protected readonly NODE_GLOW_FILTER_ID = NODE_GLOW_FILTER_ID;
  protected readonly palette = PALETTE;

  @ViewChild('svg', { static: true }) private svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('lats', { static: true }) private latsRef!: ElementRef<SVGGElement>;
  @ViewChild('mers', { static: true }) private mersRef!: ElementRef<SVGGElement>;
  @ViewChild('conns', { static: true }) private connsRef!: ElementRef<SVGGElement>;
  @ViewChild('nodes', { static: true }) private nodesRef!: ElementRef<SVGGElement>;
  @ViewChild('pulse', { static: true }) private pulseRef!: ElementRef<SVGGElement>;
  @ViewChild('label', { static: true }) private labelRef!: ElementRef<SVGGElement>;

  private renderer?: GlobeRenderer;
  private angle = 0;
  private spinSpeed = AUTO_SPIN_SPEED;
  private hoveredIndex = NO_NODE_FOCUSED;
  private selectedIndex = NO_NODE_FOCUSED;
  private press?: Press;
  private suppressNextClick = false;
  private reducedMotion = false;
  private visible = true;
  private lastFrameTime?: number;
  private frameId?: number;
  private intersectionObserver?: IntersectionObserver;
  private removeListeners: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new GlobeRenderer(
      {
        latitudes: this.latsRef.nativeElement,
        meridians: this.mersRef.nativeElement,
        edges: this.connsRef.nativeElement,
        nodes: this.nodesRef.nativeElement,
        pulse: this.pulseRef.nativeElement,
        label: this.labelRef.nativeElement,
      },
      (key) => this.i18n.translate(key),
    );
    this.renderer.build();
    this.paint();
    this.attachPointerInput();
    this.startFrameLoop();
  }

  ngOnDestroy(): void {
    this.cancelFrame();
    this.intersectionObserver?.disconnect();
    this.removeListeners.forEach((remove) => remove());
  }

  private get focusIndex(): number {
    return this.hoveredIndex !== NO_NODE_FOCUSED ? this.hoveredIndex : this.selectedIndex;
  }

  private paint(): void {
    this.renderer?.render({ angle: this.angle, focusIndex: this.focusIndex });
  }

  private startFrameLoop(): void {
    if (this.reducedMotion) return;
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0]?.isIntersecting ?? true;
        this.lastFrameTime = undefined;
        if (this.visible) this.requestFrame();
        else this.cancelFrame();
      },
      { threshold: 0 },
    );
    this.intersectionObserver.observe(this.svgRef.nativeElement);
    this.requestFrame();
  }

  /** Schedules at most one repaint; the loop keeps itself going while the globe is visible and motion is allowed. */
  private requestFrame(): void {
    if (this.frameId === undefined) this.frameId = requestAnimationFrame(this.onFrame);
  }

  private cancelFrame(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.frameId = undefined;
  }

  private readonly onFrame = (time: number): void => {
    this.frameId = undefined;
    const deltaSeconds = this.lastFrameTime === undefined ? 0 : Math.min((time - this.lastFrameTime) / 1000, MAX_FRAME_SECONDS);
    this.lastFrameTime = time;
    this.advanceSpin(deltaSeconds);
    this.paint();
    if (!this.reducedMotion && this.visible) this.requestFrame();
  };

  private advanceSpin(deltaSeconds: number): void {
    if (this.reducedMotion || this.press?.dragging) return;
    const focusFactor = this.focusIndex === NO_NODE_FOCUSED ? 1 : FOCUS_SPIN_FACTOR;
    this.spinSpeed = easeSpinSpeed(this.spinSpeed, AUTO_SPIN_SPEED * focusFactor, deltaSeconds);
    this.angle += this.spinSpeed * deltaSeconds;
  }

  private attachPointerInput(): void {
    const svg = this.svgRef.nativeElement;
    const listen = <K extends keyof SVGElementEventMap>(type: K, handler: (event: SVGElementEventMap[K]) => void) => {
      svg.addEventListener(type, handler as EventListener);
      this.removeListeners.push(() => svg.removeEventListener(type, handler as EventListener));
    };

    listen('pointerdown', (event) => this.onPointerDown(event));
    listen('pointermove', (event) => this.onPointerMove(event));
    listen('pointerup', (event) => this.onPointerEnd(event));
    listen('pointercancel', (event) => this.onPointerEnd(event));
    listen('pointerover', (event) => this.setHovered(this.nodeIndexOf(event.target)));
    listen('pointerout', (event) => this.setHovered(NO_NODE_FOCUSED, event));
    listen('pointerenter', () => svg.classList.add('globe-active'));
    listen('pointerleave', () => svg.classList.remove('globe-active'));
    listen('click', (event) => this.onClick(event));
  }

  private nodeIndexOf(target: EventTarget | null): number {
    const attribute = (target as Element | null)?.closest?.(`[${NODE_INDEX_ATTRIBUTE}]`)?.getAttribute(NODE_INDEX_ATTRIBUTE);
    return attribute === null || attribute === undefined ? NO_NODE_FOCUSED : Number(attribute);
  }

  private setHovered(index: number, leaving?: PointerEvent): void {
    if (leaving && this.nodeIndexOf(leaving.relatedTarget) !== NO_NODE_FOCUSED) return;
    if (index === this.hoveredIndex) return;
    this.hoveredIndex = index;
    this.requestFrame();
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const svg = this.svgRef.nativeElement;
    this.press = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      pixelsToViewbox: VIEWBOX_SIZE / svg.getBoundingClientRect().width,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      dragging: false,
    };
  }

  private onPointerMove(event: PointerEvent): void {
    const press = this.press;
    if (!press || press.pointerId !== event.pointerId) return;
    if (!press.dragging && Math.hypot(event.clientX - press.startX, event.clientY - press.startY) < DRAG_THRESHOLD_PX) return;
    if (!press.dragging) this.beginDrag(press);

    const deltaAngle = dragToAngle((event.clientX - press.lastX) * press.pixelsToViewbox);
    const deltaSeconds = (event.timeStamp - press.lastTime) / 1000;
    this.angle += deltaAngle;
    if (deltaSeconds > 0) {
      this.spinSpeed = clampSpinSpeed(FLING_SMOOTHING * this.spinSpeed + (1 - FLING_SMOOTHING) * (deltaAngle / deltaSeconds));
    }
    press.lastX = event.clientX;
    press.lastTime = event.timeStamp;
    this.requestFrame();
  }

  private beginDrag(press: Press): void {
    press.dragging = true;
    this.spinSpeed = 0;
    const svg = this.svgRef.nativeElement;
    svg.setPointerCapture(press.pointerId);
    svg.classList.replace('cursor-grab', 'cursor-grabbing');
  }

  private onPointerEnd(event: PointerEvent): void {
    const press = this.press;
    if (!press || press.pointerId !== event.pointerId) return;
    this.press = undefined;
    if (!press.dragging) return;

    const svg = this.svgRef.nativeElement;
    svg.classList.replace('cursor-grabbing', 'cursor-grab');
    this.suppressNextClick = true;
    // The click that follows a drag release must not select a node; clear the flag if no click arrives.
    setTimeout(() => (this.suppressNextClick = false));
    const restedBeforeRelease = event.timeStamp - press.lastTime > FLING_MAX_IDLE_MS;
    if (this.reducedMotion || restedBeforeRelease) this.spinSpeed = 0;
    this.lastFrameTime = undefined;
    this.requestFrame();
  }

  private onClick(event: MouseEvent): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }
    const clicked = this.nodeIndexOf(event.target);
    this.selectedIndex = clicked === this.selectedIndex ? NO_NODE_FOCUSED : clicked;
    this.requestFrame();
  }
}
