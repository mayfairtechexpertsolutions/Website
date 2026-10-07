import { DestroyRef, Directive, ElementRef, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Writes the pointer position, normalised to -1..1 across the host, into the
 * `--px` / `--py` CSS custom properties so descendants can tilt via CSS alone.
 * Skipped entirely when the visitor prefers reduced motion.
 */
@Directive({ selector: '[appPointerParallax]' })
export class PointerParallaxDirective {
  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;
    let pendingFrame = 0;

    const onMove = (event: PointerEvent) => {
      if (pendingFrame) return;
      pendingFrame = requestAnimationFrame(() => {
        pendingFrame = 0;
        const bounds = host.getBoundingClientRect();
        const px = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
        const py = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
        host.style.setProperty('--px', px.toFixed(3));
        host.style.setProperty('--py', py.toFixed(3));
      });
    };

    host.addEventListener('pointermove', onMove, { passive: true });
    inject(DestroyRef).onDestroy(() => {
      host.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(pendingFrame);
    });
  }
}
