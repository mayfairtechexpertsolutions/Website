import { AfterViewInit, DestroyRef, Directive, ElementRef, PLATFORM_ID, inject, input } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const COUNT_UP_DURATION_MS = 1400;

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

/**
 * Counts the host's text from 0 up to the target once it scrolls into view.
 * The prerendered HTML (and reduced-motion visitors) keep the final value.
 */
@Directive({ selector: '[appCountUp]' })
export class CountUpDirective implements AfterViewInit {
  readonly appCountUp = input.required<number>();

  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = this.appCountUp();
    let animationFrame = 0;
    this.host.textContent = '0';

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / COUNT_UP_DURATION_MS, 1);
        this.host.textContent = String(Math.round(target * easeOutCubic(progress)));
        if (progress < 1) animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    });
    observer.observe(this.host);

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
    });
  }
}
