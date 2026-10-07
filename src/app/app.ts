import { PLATFORM_ID, Component, DestroyRef, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer';
import { MobileMenuComponent } from './shared/components/mobile-menu/mobile-menu';

// Offsets anchor-link scrolling (e.g. routerLink="/#contact") so content
// doesn't land underneath the sticky navbar.
const NAVBAR_OFFSET = 96;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, MobileMenuComponent],
  templateUrl: './app.html',
})
export class App {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('progress') private progressRef?: ElementRef<HTMLElement>;

  constructor() {
    if (this.isBrowser) {
      // Angular's built-in withInMemoryScrolling anchor scroll (and
      // ViewportScroller.scrollToAnchor) never actually scrolls in this app,
      // so we drive it ourselves with plain DOM APIs. `behavior` must be
      // explicit 'instant' — with the default/smooth behavior (inherited
      // from html's `scroll-behavior: smooth`), scrollTo() silently never
      // completes here (verified in real Chrome, not just this dev
      // harness). On a cross-route navigation the new route's content (and
      // therefore document height) can still be growing for several frames
      // after NavigationEnd, so wait for scrollHeight to stop changing
      // before computing the target position — a fixed frame count
      // undershoots that and overscrolls past the target.
      const MAX_STABILIZE_FRAMES = 30;
      const scrollToFragment = (fragment: string | null) => {
        let lastHeight = -1;
        let frame = 0;
        const tick = () => {
          const height = document.documentElement.scrollHeight;
          if (height !== lastHeight && ++frame < MAX_STABILIZE_FRAMES) {
            lastHeight = height;
            requestAnimationFrame(tick);
            return;
          }
          const target = fragment ? document.getElementById(fragment) : null;
          if (target) {
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET, behavior: 'instant' });
          } else if (!fragment) {
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        };
        requestAnimationFrame(tick);
      };

      const router = inject(Router);
      const sub = router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
        scrollToFragment(router.parseUrl(e.urlAfterRedirects).fragment);
      });
      inject(DestroyRef).onDestroy(() => sub.unsubscribe());

      scrollToFragment(router.parseUrl(router.url).fragment);
    }
  }

  @HostListener('window:scroll')
  protected onScroll(): void {
    if (!this.isBrowser || !this.progressRef) return;
    const scrollTop = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (scrollTop / height) * 100 : 0;
    this.progressRef.nativeElement.style.width = `${scrolled}%`;
  }
}
