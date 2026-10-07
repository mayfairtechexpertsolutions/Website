import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const SCROLLED_THRESHOLD_PX = 24;

/** Exposes whether the page has been scrolled past the top, for header styling. */
@Injectable({ providedIn: 'root' })
export class ScrollStateService {
  private readonly scrolledState = signal(false);
  readonly scrolled = this.scrolledState.asReadonly();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    const update = () => this.scrolledState.set(window.scrollY > SCROLLED_THRESHOLD_PX);
    window.addEventListener('scroll', update, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', update));
    update();
  }
}
