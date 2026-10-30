import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/** Desktop breakpoint (Tailwind `lg`) where wheel paging is on; smaller screens scroll natively. */
export const PAGING_QUERY = '(min-width: 1024px)';
/** Space reserved under the viewport top for the sticky navbar when it can't be measured (and the tech stack's pin). */
export const NAVBAR_OFFSET = 96;
/** Each page's top-level blocks, plus the footer. Section dividers aren't stops. */
export const SECTION_SELECTOR = 'router-outlet + * > :is(header, section, main, app-page-hero), app-footer';
/** Duration (ms) of the eased scroll from one stop to the next. Higher = slower, gentler glide. */
export const STEP_SCROLL_MS = 850;
/**
 * A wheel gesture is over once no wheel event arrives for this long; only then can the next one move another
 * stop. Stops a trackpad's inertia tail (or a fast spin of the wheel) from skipping through several sections.
 */
export const WHEEL_IDLE_MS = 200;
/** Stops closer than this (px) to the current position count as the same place. */
const STOP_EPSILON_PX = 4;
/** A stop this close (px) after the previous one is dropped, so no gesture is spent on a tiny nudge. */
const MIN_STOP_GAP_PX = 120;
/** In a section taller than the screen, one gesture glides this share of the screen (the rest stays as context). */
const SCREEN_STEP = 0.85;
/** A glide may pass over at most this much (px) of content it never shows: rounding, never a line of text. */
const MAX_SKIPPED_CONTENT_PX = 8;
/**
 * Height of the fixed navbar once the page is scrolled (it shrinks from 81px). Every stop below the very top is a
 * scrolled state, so stops are placed against this height: measuring the live navbar would race its shrink
 * transition. Keep in sync with the scrolled navbar (py-1.5 + h-10 logo + 1px border).
 */
export const SCROLLED_NAVBAR_PX = 55;

/** Ease-in-out between a sine curve (felt slow) and a cubic one (felt abrupt). */
const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Top of an element in the document, ignoring transforms (`appReveal` shifts sections until they're in view). */
function documentTop(el: HTMLElement): number {
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) top += node.offsetTop;
  return top;
}

/** Returns extra stops (page scroll positions), e.g. the tech stack's layers inside its pinned track. */
export type StopSource = () => number[];

/** A stop's position now (`at`) and how to re-measure it while gliding there, in case the layout shifts. */
interface Stop {
  at: number;
  resolve: () => number;
}

/** A section's box and its content box (inside its vertical padding), in document coordinates. */
interface Block {
  top: number;
  bottom: number;
  contentTop: number;
  contentBottom: number;
}

function measureBlock(el: HTMLElement): Block {
  const style = getComputedStyle(el);
  const top = documentTop(el);
  const bottom = top + el.offsetHeight;
  return {
    top,
    bottom,
    contentTop: top + parseFloat(style.paddingTop || '0'),
    contentBottom: bottom - parseFloat(style.paddingBottom || '0'),
  };
}

/** Height of the fixed navbar at every stop but the very top; stops keep everything below it. */
function navbarHeight(): number {
  return SCROLLED_NAVBAR_PX;
}

/**
 * Site-wide section paging (desktop only). A wheel gesture down eases the page to the next section, up to the
 * previous one. Each section gets one stop when its content (inside its padding) fits under the navbar: at its
 * top if the whole section fits, otherwise with the content centred on screen (padding trimmed evenly). A section whose content is taller
 * than the screen gets two: its top under the navbar, and its bottom edge at the bottom of the screen. A glide
 * that would pass over real content it never shows (more than MAX_SKIPPED_CONTENT_PX) moves one screen
 * (SCREEN_STEP) instead. A gesture made during a glide carries on from where that glide is heading. Components
 * can add stops of their own with `addStops`.
 *
 * The wheel is the only input taken over: keyboard, scrollbar, anchor links and touch scroll as usual, and a
 * click mid-glide hands the page straight back. Under prefers-reduced-motion paging jumps instead of easing.
 */
@Injectable({ providedIn: 'root' })
export class SectionPagerService {
  private readonly sources = new Set<StopSource>();
  private reducedMotion = false;
  private frame = 0;
  /** Where the running glide ends; a new gesture counts on from here. */
  private target = 0;
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

  /**
   * Eases the page to a scroll position (jumps under reduced motion). Given a function, it's re-measured every
   * frame, so the glide still lands exactly if the layout shifts on the way (the navbar shrinks once scrolled).
   */
  scrollTo(top: number | (() => number)): void {
    this.stop();
    const resolve = typeof top === 'number' ? () => top : top;
    this.target = resolve();
    // `instant`: the global `scroll-behavior: smooth` would otherwise animate each frame's scrollTo on its own.
    if (this.reducedMotion) {
      window.scrollTo({ top: this.target, behavior: 'instant' });
      return;
    }
    const from = window.scrollY;
    let started: number | undefined;
    const tick = (time: number) => {
      started ??= time;
      const t = Math.min(1, (time - started) / STEP_SCROLL_MS);
      this.target = resolve();
      window.scrollTo({ top: from + (this.target - from) * easeInOutQuad(t), behavior: 'instant' });
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

    const y = this.animating ? this.target : window.scrollY;
    const stops = this.stops();
    const next = down
      ? stops.find((s) => s.at > y + STOP_EPSILON_PX)
      : stops.reverse().find((s) => s.at < y - STOP_EPSILON_PX);
    if (next === undefined) return;

    event.preventDefault();
    if (!isNewGesture) return;
    const screen = window.innerHeight - navbarHeight();
    const skipped = this.hiddenContent(Math.min(y, next.at), Math.max(y, next.at));
    this.scrollTo(skipped <= MAX_SKIPPED_CONTENT_PX ? next.resolve : y + (down ? 1 : -1) * screen * SCREEN_STEP);
  }

  /** Pixels of section content that neither the view at `from` nor the one at `to` (from < to) shows. */
  private hiddenContent(from: number, to: number): number {
    const bandTop = from + window.innerHeight;
    const bandBottom = to + navbarHeight();
    if (bandBottom <= bandTop) return 0;
    return Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR), measureBlock).reduce(
      (sum, b) => sum + Math.max(0, Math.min(bandBottom, b.contentBottom) - Math.max(bandTop, b.contentTop)),
      0,
    );
  }

  /** Every stop on the current page, sorted, within the scrollable range. */
  private stops(): Stop[] {
    const extra = Array.from(this.sources).flatMap((source) => {
      const values = source();
      return values.map((value, i) => ({ at: value, measure: () => source()[i] ?? value }));
    });
    const sections = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR)).flatMap((el) => {
      const view = () => ({ nav: navbarHeight(), height: window.innerHeight, block: measureBlock(el) });
      const { nav, height, block } = view();
      const screen = height - nav;
      const top = () => measureBlock(el).top - navbarHeight();
      if (block.bottom - block.top <= screen + STOP_EPSILON_PX) return [top];
      if (block.contentBottom - block.contentTop <= screen) {
        // Centre the content, without showing anything of the neighbouring sections.
        return [
          () => {
            const v = view();
            const centred = (v.block.contentTop + v.block.contentBottom) / 2 - v.nav - (v.height - v.nav) / 2;
            return Math.min(v.block.bottom - v.height, Math.max(v.block.top - v.nav, centred));
          },
        ];
      }
      // A component paging through this section (the tech stack's layers) decides where it ends.
      const driven = extra.some((s) => s.at > block.top - nav && s.at < block.bottom - nav);
      return driven ? [top] : [top, () => measureBlock(el).bottom - window.innerHeight];
    });
    const clamp = (s: number) => Math.min(document.documentElement.scrollHeight - window.innerHeight, Math.max(0, s));
    // The very top of the page is always a stop, so scrolling up ends exactly where the page starts.
    const sorted = [() => 0, ...sections, ...extra.map((s) => s.measure)]
      .map((measure) => ({ at: clamp(measure()), resolve: () => clamp(measure()) }))
      .sort((a, b) => a.at - b.at);
    const kept: Stop[] = [];
    for (const stop of sorted) {
      if (kept.length === 0 || stop.at - kept[kept.length - 1].at >= MIN_STOP_GAP_PX) kept.push(stop);
    }
    return kept;
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
