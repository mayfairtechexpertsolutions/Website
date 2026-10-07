import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A single shared IntersectionObserver backs every appReveal-hosted element,
 * matching the original site's one-observer-for-all-.reveal-elements approach
 * rather than allocating one observer per element.
 */
@Injectable({ providedIn: 'root' })
export class RevealObserverService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private observer?: IntersectionObserver;

  private getObserver(): IntersectionObserver | undefined {
    if (!this.isBrowser) return undefined;
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) entry.target.classList.add('active');
          }
        },
        { threshold: 0.15 },
      );
    }
    return this.observer;
  }

  observe(el: Element): void {
    this.getObserver()?.observe(el);
  }

  unobserve(el: Element): void {
    this.observer?.unobserve(el);
  }
}
