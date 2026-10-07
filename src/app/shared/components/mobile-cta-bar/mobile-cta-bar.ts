import { PLATFORM_ID, ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-mobile-cta-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div
      class="fixed inset-x-0 bottom-0 z-40 border-t border-mayfair-teal/20 bg-mayfair-navy px-6 py-4 shadow-2xl transition-transform duration-300 md:hidden"
      [class.mobile-cta-visible]="visible()"
      [class.mobile-cta-hidden]="!visible()"
    >
      <a
        routerLink="/"
        fragment="contact"
        class="block w-full rounded-xl bg-mayfair-teal py-3 text-center font-bold text-white shadow-lg"
      >
        {{ 'apply_btn' | translate }}
      </a>
    </div>
  `,
})
export class MobileCtaBarComponent implements OnInit, OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly visible = signal(true);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    const contact = document.getElementById('contact');
    if (!contact) return;
    this.observer = new IntersectionObserver(
      ([entry]) => this.visible.set(!entry.isIntersecting),
      { threshold: 0.1 },
    );
    this.observer.observe(contact);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
