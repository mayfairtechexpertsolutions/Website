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

/** Desktop breakpoint (Tailwind `lg`) where the section switches to scroll-driven mode. */
const SCROLL_MODE_QUERY = '(min-width: 1024px)';
/** Pixels between the viewport top and the pinned panel; clears the sticky navbar (matches `lg:top-24`). */
const PIN_TOP_PX = 96;
/** Delay between the technology chips fading in when a layer opens (mobile accordion). */
const CHIP_STAGGER_MS = 60;
/** Share of each step, at either end, where the description holds still before gliding to the next layer. */
const DWELL = 0.35;

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
 * through the layers: `progress` runs continuously from 0 (first layer) to n-1 (last), the description column
 * slides with it (eased by settleProgress so each layer rests while it's read), and the nearest layer is lifted
 * in the 3D stack. The step rail and the plates scroll the page to
 * a layer, so nothing depends on the wheel alone. Native scrolling is never intercepted.
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

  /** Continuous position through the stack while scrolling: 0 = first layer, n-1 = last. */
  protected readonly progress = signal(0);
  /** Layer opened by a tap in the mobile accordion. */
  private readonly tappedIndex = signal(0);
  private readonly scrollMode = signal(false);

  protected readonly activeIndex = computed(() =>
    this.scrollMode() ? Math.round(this.progress()) : this.tappedIndex(),
  );
  /** Progress as the description strip shows it: resting on each layer, gliding between them. */
  protected readonly settled = computed(() => settleProgress(this.progress()));
  /** 0..1 fill of the desktop step rail. */
  protected readonly railFill = computed(() => this.progress() / Math.max(1, this.layers().length - 1));

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly pinned = viewChild<ElementRef<HTMLElement>>('pinned');

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const query = window.matchMedia(SCROLL_MODE_QUERY);
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        this.updateProgress();
      });
    };
    const applyMode = () => {
      this.scrollMode.set(query.matches);
      window.removeEventListener('scroll', onScroll);
      if (query.matches) {
        window.addEventListener('scroll', onScroll, { passive: true });
        this.updateProgress();
      }
    };

    applyMode();
    query.addEventListener('change', applyMode);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('scroll', onScroll);
      query.removeEventListener('change', applyMode);
      cancelAnimationFrame(frame);
    });
  }

  /** Level from the bottom of the stack, so the first layer (frontend) sits on top. */
  protected level(index: number): number {
    return this.layers().length - 1 - index;
  }

  /** 1 for the layer in view, fading out as it scrolls away. */
  protected panelOpacity(index: number): number {
    return 1 - Math.min(1, Math.abs(this.settled() - index)) * 0.85;
  }

  /** Shows a layer: scrolls the page to it on desktop, opens it in the accordion otherwise. */
  protected goTo(index: number): void {
    if (!this.scrollMode()) {
      this.tappedIndex.set(index);
      return;
    }
    const track = this.track()?.nativeElement;
    const pinned = this.pinned()?.nativeElement;
    if (!track || !pinned) return;
    const travel = track.offsetHeight - pinned.offsetHeight;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const fraction = index / Math.max(1, this.layers().length - 1);
    window.scrollTo({ top: trackTop - PIN_TOP_PX + travel * fraction, behavior: 'smooth' });
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

  private updateProgress(): void {
    const track = this.track()?.nativeElement;
    const pinned = this.pinned()?.nativeElement;
    if (!track || !pinned) return;
    const travel = track.offsetHeight - pinned.offsetHeight;
    if (travel <= 0) return;
    const scrolled = Math.min(1, Math.max(0, (PIN_TOP_PX - track.getBoundingClientRect().top) / travel));
    this.progress.set(scrolled * (this.layers().length - 1));
  }
}
