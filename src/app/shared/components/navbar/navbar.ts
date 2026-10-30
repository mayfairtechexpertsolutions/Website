import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { PRODUCTS } from '../../../core/products/products.data';
import { MobileMenuService } from '../../../core/services/mobile-menu.service';
import { ScrollStateService } from '../../../core/services/scroll-state.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { ERP_NAV_LINKS, MAIN_NAV_LINKS } from './nav-link.model';

@Component({
  selector: 'app-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, LanguageSwitcherComponent],
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  protected readonly mobileMenu = inject(MobileMenuService);
  protected readonly products = PRODUCTS;
  protected readonly isScrolled = inject(ScrollStateService).scrolled;

  private readonly router = inject(Router);
  protected readonly isErpPage = signal(this.router.url.startsWith('/erp.html'));

  protected readonly links = computed(() => (this.isErpPage() ? ERP_NAV_LINKS : MAIN_NAV_LINKS));
  protected readonly ctaLabelKey = computed(() => (this.isErpPage() ? 'erp_trial_cta' : 'apply_btn'));
  protected readonly ctaPath = computed(() => (this.isErpPage() ? '/erp.html' : '/'));
  protected readonly ctaFragment = computed(() => (this.isErpPage() ? 'erp-contact' : 'contact'));

  /** Click/keyboard-opened state of the Products dropdown (hover opens it via CSS independently). */
  protected readonly productsOpen = signal(false);
  private readonly productsMenu = viewChild.required<ElementRef<HTMLElement>>('productsMenu');

  constructor() {
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.isErpPage.set(this.router.url.startsWith('/erp.html'));
      this.productsOpen.set(false);
    });
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  /** Close when keyboard focus leaves the dropdown (Tab past the last item). */
  protected onProductsFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (next && !this.productsMenu().nativeElement.contains(next)) this.productsOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: Event): void {
    if (this.productsOpen() && !this.productsMenu().nativeElement.contains(event.target as Node)) {
      this.productsOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.productsOpen.set(false);
  }
}
