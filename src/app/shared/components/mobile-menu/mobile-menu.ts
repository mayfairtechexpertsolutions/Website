import { PLATFORM_ID, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { PRODUCTS } from '../../../core/products/products.data';
import { MobileMenuService } from '../../../core/services/mobile-menu.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { ERP_NAV_LINKS, MAIN_NAV_LINKS } from '../navbar/nav-link.model';

@Component({
  selector: 'app-mobile-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './mobile-menu.html',
  host: {
    id: 'mobileMenu',
    class: 'fixed inset-0 z-[9999] flex w-full flex-col space-y-8 bg-white px-8 pt-4 pb-8 transition-transform duration-300 ease-in-out md:hidden dark:bg-mayfair-dark',
    '[class.menu-open]': 'menu.isOpen()',
    '[class.menu-closed]': '!menu.isOpen()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MobileMenuComponent implements OnDestroy {
  protected readonly menu = inject(MobileMenuService);
  protected readonly products = PRODUCTS;

  private readonly router = inject(Router);
  protected readonly isErpPage = signal(this.router.url.startsWith('/erp.html'));
  protected readonly links = computed(() => (this.isErpPage() ? ERP_NAV_LINKS : MAIN_NAV_LINKS));

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  constructor() {
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isErpPage.set(this.router.url.startsWith('/erp.html'));
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());

    if (this.isBrowser) {
      effect(() => {
        document.body.style.overflow = this.menu.isOpen() ? 'hidden' : '';
      });
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) document.body.style.overflow = '';
  }

  protected close(): void {
    this.menu.close();
  }

  protected onKeydown(e: KeyboardEvent): void {
    if (!this.menu.isOpen()) return;
    if (e.key === 'Escape') {
      this.close();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = this.host.nativeElement.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}
