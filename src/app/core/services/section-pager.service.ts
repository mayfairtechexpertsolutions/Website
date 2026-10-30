import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Desktop breakpoint (Tailwind `lg`) where wheel paging is on; smaller screens scroll natively. */
export const PAGING_QUERY = '(min-width: 1024px)';
/** Height of the sticky navbar: a section "starts" when its top sits this far below the viewport top. */
export const NAVBAR_OFFSET = 96;
/** Each page's top-level blocks, plus the footer. Section dividers aren't stops. */
export const SECTION_SELECTOR = 'router-outlet + * > :is(header, section, main, app-page-hero), app-footer';
/** Duration (ms) of the eased scroll from one stop to the next. Higher = slower, gentler glide. */
export const STEP_SCROLL_MS = 1100;
/**
 * A wheel gesture is over once no wheel event arrives for this long; only then can the next one move another
 * stop. Stops a trackpad's inertia tail (or a fast spin of the wheel) from skipping through several sections.
 */
export const WHEEL_IDLE_MS = 200;
/** Stops closer than this (px) to the current position, or to each other, count as the same place. */
const STOP_EPSILON_PX = 4;
/** In a section taller than the screen, one gesture glides this share of the screen (the rest stays as context). */
const SCREEN_STEP = 0.85;
/** A section up to this much taller than the screen still glides straight to the next one in one step. */
const FIT_SLACK = 0.15;

/** Gentle ease-in-out: its top speed is about half a cubic curve's, so the glide never feels rushed. */
const easeInOutSine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** Top of an element in the document, ignoring transforms (`appReveal` shifts sections until they're in view). */
function documentTop(el: HTMLElement): number {
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
}

/** Returns extra stops (page scroll positions), e.g. the tech stack's layers inside its pinned track. */
export type StopSource = () => number[];

/**
 * Site-wide section paging (desktop only). A wheel gesture down eases the page to the next section's top (just
 * under the navbar), up to the previous one. Through a section taller than the screen each gesture glides one
 * screen (SCREEN_STEP) until the next section is in reach, so nothing is skipped. Components can add stops of
 * their own with `addStops`.
 *
 * The wheel is the only input taken over: keyboard, scrollbar, anchor links and touch scroll as usual, and a
 * click mid-glide hands the page straight back. Under prefers-reduced-motion paging jumps instead of easing.
 */
@Injectable({ providedIn: 'root' })
export class SectionPagerService {
  private readonly sources = new Set<StopSource>();
  private reducedMotion = false;
  private frame = 0;
  private lastWheelTime = -Infinity;

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const query = window.matchMedia(PAGING_QUERY);
    const onWheel = (event: WheelEvent) => this.onWheel(event);
    const onPointerDown = () => this.stop();
    const removeListeners = () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
    };
    const applyMode = () => {
      removeListeners();
      this.stop();
      if (!query.matches) return;
      window.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });
    };

    applyMode();
    query.addEventListener('change', applyMode);
    inject(DestroyRef).onDestroy(() => {
      removeListeners();
      query.removeEventListener('change', applyMode);
      this.stop();
    });
  }

  /** True while an eased scroll is running. */
  get animating(): boolean {
    return this.frame !== 0;
  }

  /** Adds stops from a component; call the returned function to remove them (e.g. in `onDestroy`). */
  addStops(source: StopSource): () => void {
    this.sources.add(source);
    return () => this.sources.delete(source);
  }

  /** Eases the page to a scroll position (jumps under reduced motion). */
  scrollTo(top: number): void {
    this.stop();
    // `instant`: the global `scroll-behavior: smooth` would otherwise animate each frame's scrollTo on its own.
    if (this.reducedMotion) {
      window.scrollTo({ top, behavior: 'instant' });
      return;
    }
    const from = window.scrollY;
    let started: number | undefined;
    const tick = (time: number) => {
      started ??= time;
      const t = Math.min(1, (time - started) / STEP_SCROLL_MS);
      window.scrollTo({ top: from + (top - from) * easeInOutSine(t), behavior: 'instant' });
      this.frame = t < 1 ? requestAnimationFrame(tick) : 0;
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop(): void {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /**
   * One wheel gesture moves one stop (or one screen, inside a tall section). The event is cancelled so the page
   * doesn't also scroll natively, and the rest of the gesture is swallowed until it goes idle. It's left alone
   * (native scroll) when there is no stop that way.
   */
  private onWheel(event: WheelEvent): void {
    const isNewGesture = event.timeStamp - this.lastWheelTime > WHEEL_IDLE_MS;
    this.lastWheelTime = event.timeStamp;
    if (event.ctrlKey || event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const down = event.deltaY > 0;
    if (this.insideScrollable(event, down)) return;

    const y = window.scrollY;
    const stops = this.stops();
    const next = down
      ? stops.find((s) => s > y + STOP_EPSILON_PX)
      : stops.reverse().find((s) => s < y - STOP_EPSILON_PX);
    if (next === undefined) return;

    event.preventDefault();
    if (!isNewGesture || this.animating) return;
    const screen = window.innerHeight - NAVBAR_OFFSET;
    const fits = Math.abs(next - y) <= screen * (1 + FIT_SLACK);
    this.scrollTo(fits ? next : y + (down ? 1 : -1) * screen * SCREEN_STEP);
  }

  /** Every stop on the current page as a sorted list of scroll positions, within the scrollable range. */
  private stops(): number[] {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const sections = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR), (el) => {
      return documentTop(el) - NAVBAR_OFFSET;
    });
    const all = [...sections, ...Array.from(this.sources).flatMap((source) => source())]
      .map((s) => Math.min(max, Math.max(0, s)))
      .sort((a, b) => a - b);
    return all.filter((s, i) => i === 0 || s - all[i - 1] > STOP_EPSILON_PX);
  }

  /** True when the wheel is over something that scrolls on its own (a textarea, a menu) and can go that way. */
  private insideScrollable(event: WheelEvent, down: boolean): boolean {
    for (const target of event.composedPath()) {
      if (!(target instanceof HTMLElement) || target === document.body) break;
      const { overflowY } = getComputedStyle(target);
      if (overflowY !== 'auto' && overflowY !== 'scroll') continue;
      const canScroll = down
        ? target.scrollTop + target.clientHeight < target.scrollHeight - 1
        : target.scrollTop > 0;
      if (canScroll) return true;
    }
    return false;
  }
}
