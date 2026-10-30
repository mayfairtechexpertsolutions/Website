import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { StackLayer } from '../../../core/stack/stack-layer.model';
import { PointerParallaxDirective } from '../../directives/pointer-parallax.directive';
import { NAVBAR_OFFSET, PAGING_QUERY, SectionPagerService } from '../../../core/services/section-pager.service';

/** Pixels between the viewport top and the pinned panel; clears the sticky navbar (matches `lg:top-24`). */
const PIN_TOP_PX = NAVBAR_OFFSET;
/** Delay between the technology chips fading in when a layer opens (mobile accordion). */
const CHIP_STAGGER_MS = 60;
/** Share of each step, at either end, where the description holds still before gliding to the next layer. */
const DWELL = 0.25;
/**
 * Time constant (ms) of the glide toward the scroll position. Wheel notches jump ~100px at once; easing toward
 * them over a few frames turns those jumps into continuous motion. Higher = floatier, lower = snappier.
 */
const SMOOTHING_MS = 140;
/** Below this distance (in layers) the glide snaps to its target and the frame loop stops. */
const SETTLE_EPSILON = 0.0005;
/** When a native scroll (keyboard, scrollbar) stops between two layers for this long, it eases to the nearest. */
const SNAP_IDLE_MS = 150;
/** Distance (in layers) within which the page counts as sitting on a layer. */
const LAYER_EPSILON = 0.02;

/** Eases scroll progress so each description rests while it's read, then glides (smoothstep) to the next. */
export function settleProgress(progress: number): number {
  const step = Math.floor(progress);
  const t = Math.min(1, Math.max(0, (progress - step - DWELL) / (1 - 2 * DWELL)));
  return step + t * t * (3 - 2 * t);
}

/**
 * Interactive "technology backbone": an isometric 3D stack of layers (CSS 3D, no library) with request/response
 * packets flowing through it.
 *
 * Desktop (lg+): scroll-driven. The panel pins below the navbar inside a tall track, and scrolling the page moves
 * through the layers. Each frame, the scroll position becomes a target progress (0 = first layer, n-1 = last);
 * the shown progress glides toward it (exponential easing, SMOOTHING_MS) and is written straight to CSS custom
 * properties on the host (`--stack-settled`, `--stack-fill`), so the description strip, panel fades and rail fill
 * move without Angular change detection. Signals only change when the nearest layer changes. Each layer is a
 * stop for the site-wide SectionPagerService, so a wheel gesture eases the page to the next or previous layer
 * exactly like it moves between sections. A keyboard or scrollbar scroll that stops between layers eases to the
 * nearest one. The step rail and the plates scroll the page to a layer too. Under prefers-reduced-motion the glide
 * is skipped and paging jumps instead of easing.
 *
 * Below lg: an accordion; tapping a layer (or its plate) opens it.
 */
@Component({
  selector: 'app-tech-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TranslatePipe, PointerParallaxDirective],
  templateUrl: './tech-stack.html',
  host: { class: 'block' },
})
export class TechStackComponent {
  readonly layers = input.required<StackLayer[]>();

  protected readonly CHIP_STAGGER_MS = CHIP_STAGGER_MS;

  /** Layer nearest the scroll position (desktop). */
  private readonly scrolledIndex = signal(0);
  /** Layer opened by a tap in the mobile accordion. */
  private readonly tappedIndex = signal(0);
  private readonly scrollMode = signal(false);
  /** True once the visitor has scrolled into the stack; hides the "scroll" cue. */
  protected readonly scrolledIn = signal(false);

  protected readonly activeIndex = computed(() => (this.scrollMode() ? this.scrolledIndex() : this.tappedIndex()));

  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly pinned = viewChild<ElementRef<HTMLElement>>('pinned');
  private readonly pager = inject(SectionPagerService);

  private reducedMotion = false;
  /** Progress currently on screen; glides toward the scroll position. */
  private shown = 0;
  private frame = 0;
  private lastFrameTime?: number;
  private snapTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const query = window.matchMedia(PAGING_QUERY);
    const onScroll = () => {
      this.requestFrame();
      this.scheduleSnap();
    };
    const removeStops = this.pager.addStops(() => this.layerStops());
    const applyMode = () => {
      this.scrollMode.set(query.matches);
      window.removeEventListener('scroll', onScroll);
      if (query.matches) {
        window.addEventListener('scroll', onScroll, { passive: true });
        this.requestFrame();
      } else {
        clearTimeout(this.snapTimer);
      }
    };

    applyMode();
    query.addEventListener('change', applyMode);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      query.removeEventListener('change', applyMode);
      cancelAnimationFrame(this.frame);
      clearTimeout(this.snapTimer);
      removeStops();
    });
  }

  /** Level from the bottom of the stack, so the first layer (frontend) sits on top. */
  protected level(index: number): number {
    return this.layers().length - 1 - index;
  }

  /** Shows a layer: scrolls the page to it on desktop, opens it in the accordion otherwise. */
  protected goTo(index: number): void {
    if (!this.scrollMode()) {
      this.tappedIndex.set(index);
      return;
    }
    this.scrollToLayer(index);
  }

  /** Up/Down (and Home/End) move between layer buttons, wrapping at the ends. */
  protected onKeydown(event: KeyboardEvent, index: number, group: 'rail' | 'accordion'): void {
    const last = this.layers().length - 1;
    const target = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: last }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const wrapped = (target + last + 1) % (last + 1);
    this.goTo(wrapped);
    const host = (event.currentTarget as HTMLElement).closest('app-tech-stack');
    host?.querySelectorAll<HTMLButtonElement>(`[data-${group}-button]`)[wrapped]?.focus();
  }

  private requestFrame(): void {
    if (!this.frame) this.frame = requestAnimationFrame((time) => this.onFrame(time));
  }

  /** One animation frame: glide toward the scroll position, paint, and keep going until settled. */
  private onFrame(time: number): void {
    this.frame = 0;
    const target = this.measureProgress();
    if (target === undefined) return;

    if (this.reducedMotion) {
      this.shown = target;
    } else {
      const elapsed = this.lastFrameTime === undefined ? 16 : Math.min(64, time - this.lastFrameTime);
      this.shown += (target - this.shown) * (1 - Math.exp(-elapsed / SMOOTHING_MS));
      if (Math.abs(target - this.shown) < SETTLE_EPSILON) this.shown = target;
    }
    this.paint(this.shown);

    if (this.shown === target) {
      this.lastFrameTime = undefined;
    } else {
      this.lastFrameTime = time;
      this.requestFrame();
    }
  }

  /** After a native scroll stops between two layers, ease to the nearest one. */
  private scheduleSnap(): void {
    clearTimeout(this.snapTimer);
    if (this.pager.animating) return;
    this.snapTimer = setTimeout(() => {
      const progress = this.rawProgress();
      if (progress === undefined || progress <= 0 || progress >= this.layers().length - 1) return;
      const nearest = Math.round(progress);
      if (Math.abs(progress - nearest) > LAYER_EPSILON) this.scrollToLayer(nearest);
    }, SNAP_IDLE_MS);
  }

  /** Eases the page to a layer's scroll position. */
  private scrollToLayer(index: number): void {
    const top = this.layerStops()[index];
    if (top !== undefined) this.pager.scrollTo(top);
  }

  /** Page scroll position of each layer (desktop only; none before layout or below lg). */
  private layerStops(): number[] {
    const geometry = this.scrollMode() ? this.trackGeometry() : undefined;
    if (!geometry) return [];
    const last = Math.max(1, this.layers().length - 1);
    return this.layers().map((_, i) => geometry.start + (geometry.travel * i) / last);
  }

  /** `start`: the page scroll at which the panel pins (first layer); `travel`: pinned scroll distance. */
  private trackGeometry(): { start: number; travel: number } | undefined {
    const track = this.track()?.nativeElement;
    const pinned = this.pinned()?.nativeElement;
    if (!track || !pinned) return undefined;
    const travel = track.offsetHeight - pinned.offsetHeight;
    if (travel <= 0) return undefined;
    return { start: track.getBoundingClientRect().top + window.scrollY - PIN_TOP_PX, travel };
  }

  /** Scroll position as layer progress, unclamped: below 0 before the track, above n-1 after it. */
  private rawProgress(): number | undefined {
    const geometry = this.trackGeometry();
    if (!geometry) return undefined;
    return ((window.scrollY - geometry.start) / geometry.travel) * (this.layers().length - 1);
  }

  /** Scroll position through the track as progress (0..n-1), or undefined before layout. */
  private measureProgress(): number | undefined {
    const progress = this.rawProgress();
    return progress === undefined ? undefined : Math.min(this.layers().length - 1, Math.max(0, progress));
  }

  /** Per-frame values go to CSS variables; signals (and so change detection) only change at layer boundaries. */
  private paint(progress: number): void {
    const last = Math.max(1, this.layers().length - 1);
    this.host.style.setProperty('--stack-settled', settleProgress(progress).toFixed(4));
    this.host.style.setProperty('--stack-fill', (progress / last).toFixed(4));
    this.scrolledIndex.set(Math.round(progress));
    this.scrolledIn.set(progress > 0.3);
  }
}
